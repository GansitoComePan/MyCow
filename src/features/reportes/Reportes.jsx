import { useNavigate } from 'react-router-dom';
import './Reportes.css';

export function Reportes() {
  const navigate = useNavigate();

  return (
    <section className="reportes">
      <h1 className="reportes__title">Reportes</h1>

      <div className="reportes__grid">
        <button
          type="button"
          className="reportes__card"
          onClick={() => navigate('/reportes/inventario')}
        >
          <span className="reportes__card-icon">📄</span>
          <h2 className="reportes__card-title">Inventario</h2>
          <p className="reportes__card-desc">Listado completo de animales activos</p>
        </button>
        <button
          type="button"
          className="reportes__card"
          onClick={() => navigate('/reportes/movimientos')}
        >
          <span className="reportes__card-icon">📊</span>
          <h2 className="reportes__card-title">Movimientos</h2>
          <p className="reportes__card-desc">Historial de movimientos por potrero</p>
        </button>
        <button
          type="button"
          className="reportes__card"
          onClick={() => navigate('/reportes/bajas')}
        >
          <span className="reportes__card-icon">📉</span>
          <h2 className="reportes__card-title">Bajas</h2>
          <p className="reportes__card-desc">Reporte de defunciones</p>
        </button>
      </div>
    </section>
  );
}
