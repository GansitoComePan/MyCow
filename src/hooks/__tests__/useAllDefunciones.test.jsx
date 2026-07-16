import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { randomUUID } from 'node:crypto';
import { createDb } from '../../sync/db.js';
import { useAllDefunciones } from '../useAllDefunciones.js';

function freshDb() {
  return createDb(`test_${randomUUID()}`);
}
async function dropDb(db) {
  db.close();
  await db.delete();
}

function TestComponent({ db }) {
  const { defunciones, isLoading } = useAllDefunciones(db);
  if (isLoading) return <p>Cargando…</p>;
  if (defunciones.length === 0) return <p>Sin defunciones</p>;
  return (
    <ul>
      {defunciones.map((d) => (
        <li key={d.client_id}>
          {d.animal_arete} | {d.animal_categoria} | {d.fecha_muerte} | {d.causa}
        </li>
      ))}
    </ul>
  );
}

describe('useAllDefunciones', () => {
  let db;
  beforeEach(async () => {
    db = freshDb();
  });
  afterEach(async () => {
    await dropDb(db);
  });

  it('retorna vacío cuando no hay defunciones', async () => {
    render(<TestComponent db={db} />);
    expect(await screen.findByText('Sin defunciones')).toBeInTheDocument();
  });

  it('resuelve arete y categoría del animal', async () => {
    await db.animales.bulkAdd([
      { client_id: 'a1', id: 'a1', arete_local: '10', categoria: 'vaca', sexo: 'hembra', estado_vida: 'muerto', created_at: '2025-01-01', deleted_at: null },
    ]);
    await db.defunciones.bulkAdd([
      { client_id: 'd1', id: 'd1', animal_id: 'a1', fecha_muerte: '2025-06-01', causa: 'enfermedad', created_at: '2025-06-01', deleted_at: null },
    ]);

    render(<TestComponent db={db} />);
    const item = await screen.findByRole('listitem');
    expect(item).toHaveTextContent('10');
    expect(item).toHaveTextContent('vaca');
    expect(item).toHaveTextContent('enfermedad');
  });

  it('excluye defunciones con deleted_at', async () => {
    await db.animales.bulkAdd([
      { client_id: 'a1', id: 'a1', arete_local: '1', categoria: 'cria', sexo: 'macho', estado_vida: 'muerto', created_at: '2025-01-01', deleted_at: null },
    ]);
    await db.defunciones.bulkAdd([
      { client_id: 'd1', id: 'd1', animal_id: 'a1', fecha_muerte: '2025-06-01', causa: 'X', created_at: '2025-06-01', deleted_at: null },
      { client_id: 'd2', id: 'd2', animal_id: 'a1', fecha_muerte: '2025-06-02', causa: 'Y', created_at: '2025-06-02', deleted_at: '2025-06-03' },
    ]);

    render(<TestComponent db={db} />);
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
  });
});
