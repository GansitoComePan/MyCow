import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { randomUUID } from 'node:crypto';
import { createDb } from '../../../sync/db.js';
import { ReporteBajas } from '../ReporteBajas.jsx';

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

describe('ReporteBajas', () => {
  let db;
  beforeEach(async () => {
    db = freshDb();
  });
  afterEach(async () => {
    await dropDb(db);
  });

  it('muestra estado vacío cuando no hay defunciones', async () => {
    renderWithRouter(<ReporteBajas db={db} />);
    expect(await screen.findByText('No hay defunciones registradas.')).toBeInTheDocument();
  });

  it('renderiza tabla con defunciones', async () => {
    await db.animales.bulkAdd([
      { client_id: 'a1', id: 'a1', arete_local: '7', categoria: 'vaca', sexo: 'hembra', estado_vida: 'muerto', created_at: '2025-01-01', deleted_at: null },
      { client_id: 'a2', id: 'a2', arete_local: '8', categoria: 'cria', sexo: 'macho', estado_vida: 'muerto', created_at: '2025-01-02', deleted_at: null },
    ]);
    await db.defunciones.bulkAdd([
      { client_id: 'd1', id: 'd1', animal_id: 'a1', fecha_muerte: '2025-06-01', causa: 'Enfermedad', created_at: '2025-06-01', deleted_at: null },
      { client_id: 'd2', id: 'd2', animal_id: 'a2', fecha_muerte: '2025-06-10', causa: 'Accidente', created_at: '2025-06-10', deleted_at: null },
    ]);

    renderWithRouter(<ReporteBajas db={db} />);
    const rows = await screen.findAllByRole('row');
    expect(rows.length).toBe(3);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getAllByText('Enfermedad').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getAllByText('Accidente').length).toBeGreaterThanOrEqual(1);
  });

  it('muestra desglose por causa', async () => {
    await db.animales.bulkAdd([
      { client_id: 'a1', id: 'a1', arete_local: '10', categoria: 'vaca', sexo: 'hembra', estado_vida: 'muerto', created_at: '2025-01-01', deleted_at: null },
      { client_id: 'a2', id: 'a2', arete_local: '20', categoria: 'vaca', sexo: 'hembra', estado_vida: 'muerto', created_at: '2025-01-02', deleted_at: null },
    ]);
    await db.defunciones.bulkAdd([
      { client_id: 'd1', id: 'd1', animal_id: 'a1', fecha_muerte: '2025-06-01', causa: 'X', created_at: '2025-06-01', deleted_at: null },
      { client_id: 'd2', id: 'd2', animal_id: 'a2', fecha_muerte: '2025-06-02', causa: 'X', created_at: '2025-06-02', deleted_at: null },
    ]);

    renderWithRouter(<ReporteBajas db={db} />);
    const allX = await screen.findAllByText('X');
    expect(allX.length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });
});
