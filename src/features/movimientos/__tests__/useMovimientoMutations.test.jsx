import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { randomUUID } from 'node:crypto';
import { createDb } from '../../../sync/db.js';
import { create, update } from '../../../sync/writes.js';
import { registrarMovimiento, revertirMovimiento } from '../useMovimientoMutations.js';

function freshDb() {
  return createDb(`test_${randomUUID()}`);
}
async function dropDb(db) {
  db.close();
  await db.delete();
}

describe('registrarMovimiento', () => {
  let db;
  beforeEach(() => {
    db = freshDb();
  });
  afterEach(async () => {
    await dropDb(db);
  });

  // ── 1. Encola 1 op insert con las 3 FK por client_id + espejo local ────
  it('encola 1 insert con animal_id/potrero_origen_id/potrero_destino_id como client_id y actualiza el espejo local', async () => {
    const origen = await create(db, 'potreros', { nombre: 'Morones' });
    const destino = await create(db, 'potreros', { nombre: 'El Jagüey' });
    const animal = await create(db, 'animales', {
      arete_local: '300', categoria: 'cria', potrero_actual_id: origen.client_id,
    });
    await db.outbox.clear(); // aislar sólo las ops del movimiento

    let movimiento;
    await act(async () => {
      movimiento = await registrarMovimiento(db, {
        animal_id: animal.client_id,
        potrero_destino_id: destino.client_id,
        fecha: '2026-07-01',
      });
    });

    expect(movimiento.animal_id).toBe(animal.client_id);
    expect(movimiento.potrero_origen_id).toBe(origen.client_id);
    expect(movimiento.potrero_destino_id).toBe(destino.client_id);

    const ops = await db.outbox.toArray();
    expect(ops).toHaveLength(2); // insert movimiento + update animal (espejo)
    const movOp = ops.find((o) => o.entity === 'movimientos');
    expect(movOp).toMatchObject({ op: 'insert', client_id: movimiento.client_id });
    expect(movOp.payload).toMatchObject({
      animal_id: animal.client_id,
      potrero_origen_id: origen.client_id,
      potrero_destino_id: destino.client_id,
    });

    const animalOp = ops.find((o) => o.entity === 'animales');
    expect(animalOp).toMatchObject({ op: 'update', client_id: animal.client_id });
    expect(animalOp.payload.potrero_actual_id).toBe(destino.client_id);

    const animalLocal = await db.animales.get(animal.client_id);
    expect(animalLocal.potrero_actual_id).toBe(destino.client_id);
  });

  // ── 2. Origen autodetectado: NULL permitido (alta) ──────────────────────
  it('origen autodetectado: si el animal no tiene potrero_actual_id, el movimiento nace con origen NULL', async () => {
    const destino = await create(db, 'potreros', { nombre: 'El Salto' });
    const animal = await create(db, 'animales', { arete_local: '10', categoria: 'vaca' });
    await db.outbox.clear();

    const movimiento = await registrarMovimiento(db, {
      animal_id: animal.client_id,
      potrero_destino_id: destino.client_id,
      fecha: '2026-07-01',
    });

    expect(movimiento.potrero_origen_id).toBeNull();
    expect(movimiento.potrero_destino_id).toBe(destino.client_id);
  });

  // ── 3. Validación destino == origen ──────────────────────────────────────
  it('bloquea el guardado si destino == origen, con mensaje claro, sin escribir nada', async () => {
    const potrero = await create(db, 'potreros', { nombre: 'Mesas' });
    const animal = await create(db, 'animales', {
      arete_local: '5', categoria: 'vaca', potrero_actual_id: potrero.client_id,
    });
    await db.outbox.clear();

    await expect(
      registrarMovimiento(db, {
        animal_id: animal.client_id,
        potrero_destino_id: potrero.client_id,
        fecha: '2026-07-01',
      })
    ).rejects.toThrow(/distinto del potrero de origen/);

    expect(await db.movimientos.count()).toBe(0);
    expect(await db.outbox.count()).toBe(0);
    expect((await db.animales.get(animal.client_id)).potrero_actual_id).toBe(potrero.client_id);
  });

  it('bloquea el guardado si no se elige destino', async () => {
    const animal = await create(db, 'animales', { arete_local: '6', categoria: 'vaca' });
    await db.outbox.clear();

    await expect(
      registrarMovimiento(db, { animal_id: animal.client_id, potrero_destino_id: null, fecha: '2026-07-01' })
    ).rejects.toThrow(/potrero destino es obligatorio/);

    expect(await db.movimientos.count()).toBe(0);
  });

  // ── 4. Animal creado en la misma sesión offline (sin id real aún) ───────
  it('permite registrar el movimiento de un animal recién creado offline (sin id real), encolado por client_id', async () => {
    const destino = await create(db, 'potreros', { nombre: 'El Jagüey' });
    const animal = await create(db, 'animales', { arete_local: '92', categoria: 'cria' }); // sin `id` (sin pull todavía)

    const movimiento = await registrarMovimiento(db, {
      animal_id: animal.client_id,
      potrero_destino_id: destino.client_id,
      fecha: '2026-07-01',
    });

    expect(movimiento.animal_id).toBe(animal.client_id);
    const ops = await db.outbox.toArray();
    expect(ops.find((o) => o.entity === 'movimientos').client_id).toBe(movimiento.client_id);
  });
});

describe('revertirMovimiento', () => {
  let db;
  beforeEach(() => {
    db = freshDb();
  });
  afterEach(async () => {
    await dropDb(db);
  });

  async function setupWithMovement() {
    const origen = await create(db, 'potreros', { nombre: 'Morones' });
    const destino = await create(db, 'potreros', { nombre: 'El Jagüey' });
    const animal = await create(db, 'animales', {
      arete_local: '300', categoria: 'cria', potrero_actual_id: origen.client_id,
    });
    const mov = await registrarMovimiento(db, {
      animal_id: animal.client_id,
      potrero_destino_id: destino.client_id,
      fecha: '2026-07-01',
    });
    await db.outbox.clear();
    return { origen, destino, animal, mov };
  }

  it('crea un movimiento inverso y marca el original como revertido', async () => {
    const { origen, destino, animal, mov } = await setupWithMovement();

    const inverso = await revertirMovimiento(db, mov.client_id, { fecha: '2026-07-15' });

    expect(inverso.animal_id).toBe(animal.client_id);
    expect(inverso.potrero_origen_id).toBe(destino.client_id);
    expect(inverso.potrero_destino_id).toBe(origen.client_id);
    expect(inverso.fecha).toBe('2026-07-15');

    const original = await db.movimientos.get(mov.client_id);
    expect(original.revertido_en).toBeTruthy();

    const animalActual = await db.animales.get(animal.client_id);
    expect(animalActual.potrero_actual_id).toBe(origen.client_id);
  });

  it('encola 2 ops: insert movimiento inverso + update original (revertido_en)', async () => {
    const { mov } = await setupWithMovement();

    await revertirMovimiento(db, mov.client_id);

    const ops = await db.outbox.toArray();
    const insertOp = ops.find((o) => o.op === 'insert' && o.entity === 'movimientos');
    const updateOp = ops.find((o) => o.op === 'update' && o.entity === 'movimientos');
    expect(insertOp).toBeTruthy();
    expect(updateOp).toBeTruthy();
    expect(updateOp.client_id).toBe(mov.client_id);
    expect(updateOp.payload.revertido_en).toBeTruthy();
  });

  it('si el animal ya no está en el destino, lanza error', async () => {
    const { destino, animal, mov } = await setupWithMovement();
    await update(db, 'animales', animal.client_id, { potrero_actual_id: null });

    await expect(
      revertirMovimiento(db, mov.client_id)
    ).rejects.toThrow(/ya no está en el potrero destino/);
  });

  it('si el movimiento ya fue revertido, lanza error', async () => {
    const { mov } = await setupWithMovement();
    await revertirMovimiento(db, mov.client_id);

    await expect(
      revertirMovimiento(db, mov.client_id)
    ).rejects.toThrow(/ya fue revertido/);
  });

  it('si el movimiento no existe, lanza error', async () => {
    await expect(
      revertirMovimiento(db, 'no-existe')
    ).rejects.toThrow(/no encontrado/);
  });

  it('si el movimiento tiene origen NULL (alta), no permite revertir', async () => {
    const destino = await create(db, 'potreros', { nombre: 'El Salto' });
    const animal = await create(db, 'animales', { arete_local: '10', categoria: 'vaca' });
    const mov = await registrarMovimiento(db, {
      animal_id: animal.client_id,
      potrero_destino_id: destino.client_id,
      fecha: '2026-07-01',
    });
    await db.outbox.clear();

    await expect(
      revertirMovimiento(db, mov.client_id)
    ).rejects.toThrow(/No se puede revertir/);
  });
});
