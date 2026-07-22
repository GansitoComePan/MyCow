import { useMemo } from 'react';
import { create, update } from '../../sync/writes.js';
import { db as defaultDb } from '../../sync/db.js';

/**
 * registrarMovimiento: alta de un movimiento + espejo optimista del cache
 * animales.potrero_actual_id, en UNA sola transacción Dexie.
 *
 * potrero_origen_id NO lo teclea el usuario: se deriva del cache local
 * animales.potrero_actual_id del animal (que espeja v_potrero_actual). Si el
 * animal no tiene potrero actual (alta inicial) el origen es NULL y se
 * permite: es el primer movimiento.
 *
 * Las 3 FK (animal_id, potrero_origen_id, potrero_destino_id) se guardan
 * como client_id local; el motor de sync las traduce a id real en push (o
 * espera en 'waiting_ref' si el referenciado aún no sincronizó — ver
 * FK_FIELDS.movimientos en sync/engine.js).
 *
 * El espejo de potrero_actual_id aquí es OPTIMISTA: da feedback inmediato
 * offline. La fuente de verdad remota es el trigger del server
 * (fn_movimiento_actualiza_cache) sobre la vista v_potrero_actual; el
 * próximo pull reconcilia si algo diverge (p.ej. dos dispositivos movieron
 * al mismo animal offline). NO reimplementamos esa lógica: sólo la
 * anticipamos localmente reusando `create`/`update` de writes.js, que se
 * unen a la MISMA transacción Dexie (Dexie hereda la transacción padre
 * cuando las tablas están incluidas en su alcance).
 */
export async function registrarMovimiento(db, { animal_id, potrero_destino_id, fecha, detalle }) {
  return db.transaction('rw', db.movimientos, db.animales, db.outbox, async () => {
    const animal = await db.animales.get(animal_id);
    if (!animal) {
      throw new Error(`registrarMovimiento: no existe animal client_id=${animal_id}`);
    }
    const potrero_origen_id = animal.potrero_actual_id ?? null;

    if (!potrero_destino_id) {
      throw new Error('El potrero destino es obligatorio.');
    }
    if (potrero_destino_id === potrero_origen_id) {
      throw new Error('El potrero destino debe ser distinto del potrero de origen.');
    }

    const movimiento = await create(db, 'movimientos', {
      animal_id,
      potrero_origen_id,
      potrero_destino_id,
      fecha,
      detalle: detalle ?? null,
    });

    await update(db, 'animales', animal_id, { potrero_actual_id: potrero_destino_id });

    return movimiento;
  });
}

/**
 * registrarMovimientoBatch: mueve N animales al mismo potrero destino en UNA
 * sola transacción Dexie. Skipea animales cuyo origen ya es el destino.
 */
export async function registrarMovimientoBatch(db, { animalIds, potrero_destino_id, fecha, detalle }) {
  if (!potrero_destino_id) {
    throw new Error('El potrero destino es obligatorio.');
  }
  return db.transaction('rw', db.movimientos, db.animales, db.outbox, async () => {
    let moved = 0;
    for (const animalId of animalIds) {
      const animal = await db.animales.get(animalId);
      if (!animal || animal.estado_vida !== 'activo') continue;
      const potrero_origen_id = animal.potrero_actual_id ?? null;
      if (potrero_destino_id === potrero_origen_id) continue;

      await create(db, 'movimientos', {
        animal_id: animalId,
        potrero_origen_id,
        potrero_destino_id,
        fecha,
        detalle: detalle ?? null,
      });
      await update(db, 'animales', animalId, { potrero_actual_id: potrero_destino_id });
      moved++;
    }
    return moved;
  });
}

/**
 * revertirMovimiento: crea un movimiento inverso + marca el original como
 * revertido, en UNA sola transacción Dexie. El animal debe estar actualmente
 * en el potrero destino del movimiento original para poder revertir.
 */
export async function revertirMovimiento(db, movimientoClientId, { fecha, detalle } = {}) {
  return db.transaction('rw', db.movimientos, db.animales, db.outbox, async () => {
    const original = await db.movimientos.get(movimientoClientId);
    if (!original) {
      throw new Error('Movimiento no encontrado.');
    }
    if (original.deleted_at != null) {
      throw new Error('Movimiento ya fue eliminado.');
    }
    if (original.revertido_en) {
      throw new Error('Este movimiento ya fue revertido.');
    }
    if (original.potrero_origen_id == null) {
      throw new Error('No se puede revertir un movimiento de alta inicial (sin potrero de origen).');
    }

    const animal = await db.animales.get(original.animal_id);
    if (!animal) {
      throw new Error('El animal ya no existe.');
    }
    if (animal.potrero_actual_id !== original.potrero_destino_id) {
      throw new Error(
        'El animal ya no está en el potrero destino de este movimiento; no se puede revertir automáticamente.'
      );
    }

    const revertDate = fecha || new Date().toISOString().slice(0, 10);

    const inverso = await create(db, 'movimientos', {
      animal_id: original.animal_id,
      potrero_origen_id: original.potrero_destino_id,
      potrero_destino_id: original.potrero_origen_id,
      fecha: revertDate,
      detalle: detalle ?? `Revertido del movimiento del ${original.fecha}`,
    });

    await update(db, 'movimientos', movimientoClientId, {
      revertido_en: new Date().toISOString(),
    });

    await update(db, 'animales', original.animal_id, {
      potrero_actual_id: original.potrero_origen_id,
    });

    return inverso;
  });
}

export function useMovimientoMutations(db = defaultDb) {
  return useMemo(
    () => ({
      registrarMovimiento: (data) => registrarMovimiento(db, data),
      registrarMovimientoBatch: (data) => registrarMovimientoBatch(db, data),
      revertirMovimiento: (movimientoClientId, opts) => revertirMovimiento(db, movimientoClientId, opts),
    }),
    [db]
  );
}
