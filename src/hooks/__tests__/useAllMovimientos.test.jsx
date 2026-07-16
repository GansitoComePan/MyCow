import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { randomUUID } from 'node:crypto';
import { createDb } from '../../sync/db.js';
import { useAllMovimientos } from '../useAllMovimientos.js';

function freshDb() {
  return createDb(`test_${randomUUID()}`);
}
async function dropDb(db) {
  db.close();
  await db.delete();
}

function TestComponent({ db }) {
  const { movimientos, isLoading } = useAllMovimientos(db);
  if (isLoading) return <p>Cargando…</p>;
  if (movimientos.length === 0) return <p>Sin movimientos</p>;
  return (
    <ul>
      {movimientos.map((m) => (
        <li key={m.client_id}>
          {m.animal_arete} | {m.potrero_origen_nombre} → {m.potrero_destino_nombre} | {m.fecha}
        </li>
      ))}
    </ul>
  );
}

describe('useAllMovimientos', () => {
  let db;
  beforeEach(async () => {
    db = freshDb();
  });
  afterEach(async () => {
    await dropDb(db);
  });

  it('retorna vacío cuando no hay movimientos', async () => {
    render(<TestComponent db={db} />);
    expect(await screen.findByText('Sin movimientos')).toBeInTheDocument();
  });

  it('resuelve arete del animal y nombres de potreros', async () => {
    await db.potreros.bulkAdd([
      { client_id: 'p1', id: 'p1', nombre: 'Jagüey', updated_at: '2025-01-01', deleted_at: null },
      { client_id: 'p2', id: 'p2', nombre: 'Llano', updated_at: '2025-01-01', deleted_at: null },
    ]);
    await db.animales.bulkAdd([
      { client_id: 'a1', id: 'a1', arete_local: '42', categoria: 'vaca', sexo: 'hembra', estado_vida: 'activo', created_at: '2025-01-01', deleted_at: null },
    ]);
    await db.movimientos.bulkAdd([
      { client_id: 'm1', id: 'm1', animal_id: 'a1', potrero_origen_id: 'p1', potrero_destino_id: 'p2', fecha: '2025-06-01', created_at: '2025-06-01', deleted_at: null },
    ]);

    render(<TestComponent db={db} />);
    const item = await screen.findByRole('listitem');
    expect(item).toHaveTextContent('42');
    expect(item).toHaveTextContent('Jagüey');
    expect(item).toHaveTextContent('Llano');
  });

  it('excluye movimientos con deleted_at', async () => {
    await db.animales.bulkAdd([
      { client_id: 'a1', id: 'a1', arete_local: '1', categoria: 'vaca', sexo: 'hembra', estado_vida: 'activo', created_at: '2025-01-01', deleted_at: null },
    ]);
    await db.potreros.bulkAdd([
      { client_id: 'p1', id: 'p1', nombre: 'A', updated_at: '2025-01-01', deleted_at: null },
      { client_id: 'p2', id: 'p2', nombre: 'B', updated_at: '2025-01-01', deleted_at: null },
    ]);
    await db.movimientos.bulkAdd([
      { client_id: 'm1', id: 'm1', animal_id: 'a1', potrero_origen_id: 'p1', potrero_destino_id: 'p2', fecha: '2025-06-01', created_at: '2025-06-01', deleted_at: null },
      { client_id: 'm2', id: 'm2', animal_id: 'a1', potrero_origen_id: 'p1', potrero_destino_id: 'p2', fecha: '2025-06-02', created_at: '2025-06-02', deleted_at: '2025-06-03' },
    ]);

    render(<TestComponent db={db} />);
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
  });
});
