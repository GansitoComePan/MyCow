import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnimales } from '../../hooks/useAnimales.js';
import { capitalize, categoriaLabel, formatDate } from '../../utils.js';
import { db as defaultDb } from '../../sync/db.js';
import './ReportesSub.css';

const TABS = [
  { key: '', label: 'Todas' },
  { key: 'vaca', label: 'Vacas' },
  { key: 'semental', label: 'Sementales' },
  { key: 'cria', label: 'Crías' },
];

export function ReporteInventario({ db = defaultDb }) {
  const navigate = useNavigate();
  const { animales, isLoading } = useAnimales(db);
  const [tab, setTab] = useState('');

  const filtered = useMemo(() => {
    if (!tab) return animales;
    return animales.filter((a) => a.categoria === tab);
  }, [animales, tab]);

  const resumen = useMemo(() => {
    const total = animales.length;
    const porCategoria = {};
    const porEstado = {};
    for (const a of animales) {
      porCategoria[a.categoria] = (porCategoria[a.categoria] || 0) + 1;
      porEstado[a.estado_vida] = (porEstado[a.estado_vida] || 0) + 1;
    }
    return { total, porCategoria, porEstado };
  }, [animales]);

  return (
    <section className="reporte-sub">
      <header className="reporte-sub__header">
        <button type="button" className="reporte-sub__back" onClick={() => navigate('/reportes')}>
          ← Volver
        </button>
        <h1 className="reporte-sub__title">Inventario de Animales</h1>
      </header>

      <div className="reporte-sub__summary">
        <div className="reporte-sub__stat">
          <span className="reporte-sub__stat-value">{resumen.total}</span>
          <span className="reporte-sub__stat-label">Total</span>
        </div>
        {Object.entries(resumen.porCategoria).map(([cat, count]) => (
          <div key={cat} className="reporte-sub__stat">
            <span className="reporte-sub__stat-value">{count}</span>
            <span className="reporte-sub__stat-label">{capitalize(cat)}</span>
          </div>
        ))}
      </div>

      <div className="reporte-sub__tabs" role="tablist">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={`reporte-sub__tab${tab === key ? ' reporte-sub__tab--active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <p className="reporte-sub__status">Cargando…</p>}

      {!isLoading && filtered.length === 0 && (
        <p className="reporte-sub__status">No hay animales para mostrar.</p>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="reporte-sub__table-wrap">
          <table className="reporte-sub__table">
            <thead>
              <tr>
                <th>Arete</th>
                <th>Categoría</th>
                <th>Sexo</th>
                <th>Raza</th>
                <th>Potrero</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.client_id}>
                  <td>{a.arete_local ?? '—'}</td>
                  <td>{categoriaLabel(a.categoria, a.sexo)}</td>
                  <td>{capitalize(a.sexo)}</td>
                  <td>{a.raza ?? '—'}</td>
                  <td>{a.potrero_nombre ?? '—'}</td>
                  <td>{capitalize(a.estado_vida)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
