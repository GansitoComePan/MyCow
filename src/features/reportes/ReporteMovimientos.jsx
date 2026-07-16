import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllMovimientos } from '../../hooks/useAllMovimientos.js';
import { formatDate } from '../../utils.js';
import { DateFilter, filterByDateRange } from './DateFilter.jsx';
import { db as defaultDb } from '../../sync/db.js';
import './ReportesSub.css';

export function ReporteMovimientos({ db = defaultDb }) {
  const navigate = useNavigate();
  const { movimientos, isLoading } = useAllMovimientos(db);
  const [dateFilter, setDateFilter] = useState({ preset: '30d' });

  const filtered = useMemo(() => {
    const range = { desde: dateFilter.desde, hasta: dateFilter.hasta };
    return filterByDateRange(movimientos, 'fecha', range);
  }, [movimientos, dateFilter]);

  return (
    <section className="reporte-sub">
      <header className="reporte-sub__header">
        <button type="button" className="reporte-sub__back" onClick={() => navigate('/reportes')}>
          ← Volver
        </button>
        <h1 className="reporte-sub__title">Historial de Movimientos</h1>
      </header>

      <div className="reporte-sub__summary">
        <div className="reporte-sub__stat">
          <span className="reporte-sub__stat-value">{movimientos.length}</span>
          <span className="reporte-sub__stat-label">Total</span>
        </div>
        <div className="reporte-sub__stat">
          <span className="reporte-sub__stat-value">{filtered.length}</span>
          <span className="reporte-sub__stat-label">En rango</span>
        </div>
      </div>

      <DateFilter value={dateFilter} onChange={setDateFilter} />

      {isLoading && <p className="reporte-sub__status">Cargando…</p>}

      {!isLoading && filtered.length === 0 && (
        <p className="reporte-sub__status">No hay movimientos en el rango seleccionado.</p>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="reporte-sub__table-wrap">
          <table className="reporte-sub__table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Arete</th>
                <th>Origen</th>
                <th>Destino</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.client_id}>
                  <td>{formatDate(m.fecha)}</td>
                  <td>{m.animal_arete ?? '—'}</td>
                  <td>{m.potrero_origen_nombre ?? '—'}</td>
                  <td>{m.potrero_destino_nombre ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
