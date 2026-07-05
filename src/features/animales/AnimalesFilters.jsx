import { capitalize } from '../../utils.js';
import './AnimalesFilters.css';

/**
 * Filtro de estado de vida + selector de ordenamiento.
 */
export function AnimalesFilters({
  estadoVidaOptions,
  estadoVida,
  onEstadoVidaChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="animales-filters">
      <label className="animales-filters__field">
        <span>Estado</span>
        <select value={estadoVida} onChange={(e) => onEstadoVidaChange(e.target.value)}>
          <option value="">Todos</option>
          {estadoVidaOptions.map((opt) => (
            <option key={opt} value={opt}>
              {capitalize(opt)}
            </option>
          ))}
        </select>
      </label>

      <label className="animales-filters__field">
        <span>Ordenar por</span>
        <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
          <option value="arete">Arete morado</option>
          <option value="potrero">Potrero</option>
        </select>
      </label>
    </div>
  );
}
