import { useState, useMemo, useRef, useEffect } from 'react';
import { capitalize } from '../../utils.js';

function describeAnimal(a) {
  const arete = a.arete_local ? `Arete ${a.arete_local}` : 'sin arete';
  const color = a.color ? `, ${a.color}` : '';
  return `${arete} — ${capitalize(a.categoria)}${color}`;
}

function matchAnimal(a, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    (a.arete_local && a.arete_local.toLowerCase().includes(q)) ||
    (a.raza && a.raza.toLowerCase().includes(q)) ||
    (a.color && a.color.toLowerCase().includes(q)) ||
    (a.categoria && a.categoria.toLowerCase().includes(q))
  );
}

export function ParentSelect({ label, animales, value, onChange, excludeClientId, sexo }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);

  const selected = useMemo(() => animales.find((a) => a.client_id === value), [animales, value]);

  const candidates = useMemo(() => {
    let list = animales.filter((a) => a.client_id !== excludeClientId);
    if (sexo) list = list.filter((a) => a.sexo === sexo);
    return list;
  }, [animales, excludeClientId, sexo]);

  const filtered = useMemo(() => {
    return candidates.filter((a) => matchAnimal(a, query)).slice(0, 20);
  }, [candidates, query]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(a) {
    onChange(a.client_id);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleClear() {
    onChange(null);
    setQuery('');
    inputRef.current?.focus();
  }

  return (
    <label className="animal-form__field">
      <span>{label}</span>
      <div className="parent-select" ref={ref}>
        <input
          ref={inputRef}
          type="text"
          className="parent-select__input"
          placeholder={selected ? describeAnimal(selected) : 'Buscar…'}
          value={open ? query : ''}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setQuery(''); setOpen(true); }}
        />
        {selected && !open && (
          <button type="button" className="parent-select__clear" onClick={handleClear} aria-label="Quitar">
            ×
          </button>
        )}
        {open && (
          <ul className="parent-select__dropdown">
            {filtered.length === 0 ? (
              <li className="parent-select__empty">Sin resultados</li>
            ) : (
              filtered.map((a) => (
                <li
                  key={a.client_id}
                  className={`parent-select__option${a.client_id === value ? ' parent-select__option--selected' : ''}`}
                  onClick={() => handleSelect(a)}
                >
                  <span className="parent-select__option-arete">Arete {a.arete_local}</span>
                  <span className="parent-select__option-desc">
                    {capitalize(a.categoria)}{a.raza ? ` · ${a.raza}` : ''}{a.color ? ` · ${a.color}` : ''}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </label>
  );
}
