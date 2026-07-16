import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllDefunciones } from '../../hooks/useAllDefunciones.js';
import { capitalize, categoriaLabel, formatDate } from '../../utils.js';
import { DateFilter, filterByDateRange } from './DateFilter.jsx';
import { db as defaultDb } from '../../sync/db.js';
import './ReportesSub.css';

export function ReporteBajas({ db = defaultDb }) {
  const navigate = useNavigate();
  const { defunciones, isLoading } = useAllDefunciones(db);
  const [dateFilter, setDateFilter] = useState({ preset: '' });

  const filtered = useMemo(() => {
    const range = { desde: dateFilter.desde, hasta: dateFilter.hasta };
    return filterByDateRange(defunciones, 'fecha_muerte', range);
  }, [defunciones, dateFilter]);

  const porCausa = useMemo(() => {
    const counts = {};
    for (const d of filtered) {
      const causa = d.causa || 'No especificada';
      counts[causa] = (counts[causa] || 0) + 1;
    }
    return counts;
  }, [filtered]);

  return (
    <section className="reporte-sub">
      <header className="reporte-sub__header">
        <button type="button" className="reporte-sub__back" onClick={() => navigate('/reportes')}>
          ← Volver
        </button>
        <h1 className="reporte-sub__title">Reporte de Bajas</h1>
      </header>

      <div className="reporte-sub__summary">
        <div className="reporte-sub__stat">
          <span className="reporte-sub__stat-value">{defunciones.length}</span>
          <span className="reporte-sub__stat-label">Total</span>
        </div>
        <div className="reporte-sub__stat">
          <span className="reporte-sub__stat-value">{filtered.length}</span>
          <span className="reporte-sub__stat-label">En rango</span>
        </div>
      </div>

      {Object.keys(porCausa).length > 0 && (
        <div className="reporte-sub__breakdown">
          <h2 className="reporte-sub__breakdown-title">Por causa</h2>
          <div className="reporte-sub__breakdown-grid">
            {Object.entries(porCausa).map(([causa, count]) => (
              <div key={causa} className="reporte-sub__stat reporte-sub__stat--sm">
                <span className="reporte-sub__stat-value">{count}</span>
                <span className="reporte-sub__stat-label">{causa}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <DateFilter value={dateFilter} onChange={setDateFilter} />

      {isLoading && <p className="reporte-sub__status">Cargando…</p>}

      {!isLoading && filtered.length === 0 && (
        <p className="reporte-sub__status">No hay defunciones registradas.</p>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="reporte-sub__table-wrap">
          <table className="reporte-sub__table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Arete</th>
                <th>Categoría</th>
                <th>Causa</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.client_id}>
                  <td>{formatDate(d.fecha_muerte)}</td>
                  <td>{d.animal_arete ?? '—'}</td>
                  <td>{d.animal_categoria ? categoriaLabel(d.animal_categoria, d.animal_sexo) : '—'}</td>
                  <td>{d.causa ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
