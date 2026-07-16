import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { randomUUID } from 'node:crypto';
import { createDb } from '../../../sync/db.js';
import { ReporteInventario } from '../ReporteInventario.jsx';

function freshDb() {
  return createDb(`test_${randomUUID()}`);
}
async function dropDb(db) {
  db.close();
  await db.delete();
}

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ReporteInventario', () => {
  let db;
  beforeEach(async () => {
    db = freshDb();
  });
  afterEach(async () => {
    await dropDb(db);
  });

  it('muestra estado vacío cuando no hay animales', async () => {
    renderWithRouter(<ReporteInventario db={db} />);
    expect(await screen.findByText('No hay animales para mostrar.')).toBeInTheDocument();
  });

  it('renderiza tabla con animales activos', async () => {
    await db.potreros.bulkAdd([
      { client_id: 'p1', id: 'p1', nombre: 'Potrero A', updated_at: '2025-01-01', deleted_at: null },
    ]);
    await db.animales.bulkAdd([
      { client_id: 'a1', id: 'a1', arete_local: '10', categoria: 'vaca', sexo: 'hembra', raza: 'brangus', estado_vida: 'activo', potrero_actual_id: 'p1', created_at: '2025-01-01', deleted_at: null },
      { client_id: 'a2', id: 'a2', arete_local: '20', categoria: 'cria', sexo: 'macho', estado_vida: 'activo', created_at: '2025-01-02', deleted_at: null },
    ]);

    renderWithRouter(<ReporteInventario db={db} />);
    const rows = await screen.findAllByRole('row');
    expect(rows.length).toBe(3);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('brangus')).toBeInTheDocument();
    expect(screen.getByText('Potrero A')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('excluye animales con deleted_at', async () => {
    await db.animales.bulkAdd([
      { client_id: 'a1', id: 'a1', arete_local: '100', categoria: 'vaca', sexo: 'hembra', estado_vida: 'activo', created_at: '2025-01-01', deleted_at: null },
      { client_id: 'a2', id: 'a2', arete_local: '200', categoria: 'vaca', sexo: 'hembra', estado_vida: 'activo', created_at: '2025-01-02', deleted_at: '2025-02-01' },
    ]);

    renderWithRouter(<ReporteInventario db={db} />);
    await screen.findByText('100');
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2);
    expect(screen.queryByText('200')).not.toBeInTheDocument();
  });

  it('filtra por categoría usando tabs', async () => {
    await db.animales.bulkAdd([
      { client_id: 'a1', id: 'a1', arete_local: '10', categoria: 'vaca', sexo: 'hembra', estado_vida: 'activo', created_at: '2025-01-01', deleted_at: null },
      { client_id: 'a2', id: 'a2', arete_local: '20', categoria: 'cria', sexo: 'macho', estado_vida: 'activo', created_at: '2025-01-02', deleted_at: null },
    ]);

    renderWithRouter(<ReporteInventario db={db} />);
    await screen.findByText('10');

    fireEvent.click(screen.getByText('Crías'));

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2);
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });
});
