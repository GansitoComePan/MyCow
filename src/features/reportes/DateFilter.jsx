import './DateFilter.css';

const PRESETS = [
  { key: '', label: 'Todo' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: '90d', label: '90 días' },
  { key: '1y', label: '1 año' },
];

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function resolvePreset(key) {
  if (!key) return { desde: null, hasta: null };
  const now = new Date();
  const hasta = toISODate(now);
  const desde = new Date(now);
  if (key === '7d') desde.setDate(desde.getDate() - 7);
  else if (key === '30d') desde.setDate(desde.getDate() - 30);
  else if (key === '90d') desde.setDate(desde.getDate() - 90);
  else if (key === '1y') desde.setFullYear(desde.getFullYear() - 1);
  return { desde: toISODate(desde), hasta };
}

/**
 * Selector de rango de fechas con presets rápidos + inputs manuales.
 * `onChange({ desde, hasta })` — ambos ISO (YYYY-MM-DD) o null.
 */
export function DateFilter({ value, onChange }) {
  const { preset = '', desde = '', hasta = '' } = value ?? {};

  function handlePreset(key) {
    const resolved = resolvePreset(key);
    onChange({ preset: key, ...resolved });
  }

  function handleCustom(field, val) {
    onChange({ preset: '', ...value, [field]: val || undefined });
  }

  return (
    <div className="date-filter">
      <div className="date-filter__presets">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`date-filter__preset${preset === key ? ' date-filter__preset--active' : ''}`}
            onClick={() => handlePreset(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="date-filter__custom">
        <label className="date-filter__label">
          Desde
          <input
            type="date"
            className="date-filter__input"
            value={desde ?? ''}
            onChange={(e) => handleCustom('desde', e.target.value)}
          />
        </label>
        <label className="date-filter__label">
          Hasta
          <input
            type="date"
            className="date-filter__input"
            value={hasta ?? ''}
            onChange={(e) => handleCustom('hasta', e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

/**
 * Filtra un array de objetos que tengan un campo de fecha dado,
 * usando { desde, hasta } en formato ISO (YYYY-MM-DD).
 */
export function filterByDateRange(items, dateField, { desde, hasta } = {}) {
  if (!desde && !hasta) return items;
  return items.filter((item) => {
    const val = item[dateField];
    if (!val) return false;
    const date = val.slice(0, 10);
    if (desde && date < desde) return false;
    if (hasta && date > hasta) return false;
    return true;
  });
}
