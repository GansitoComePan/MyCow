import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as defaultDb } from '../../sync/db.js';
import { registrarMovimientoBatch } from './useMovimientoMutations.js';
import './BulkMoveModal.css';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function BulkMoveModal({ db = defaultDb, animalIds, onClose }) {
  const [potreroDestinoId, setPotreroDestinoId] = useState('');
  const [fecha, setFecha] = useState(todayIso);
  const [detalle, setDetalle] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const potreros = useLiveQuery(
    () => db.potreros.filter((p) => p.deleted_at == null && p.activo !== false).toArray(),
    [db]
  );

  async function handleSubmit() {
    setError(null);

    if (!potreroDestinoId) {
      setError('El potrero destino es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      const moved = await registrarMovimientoBatch(db, {
        animalIds,
        potrero_destino_id: potreroDestinoId,
        fecha,
        detalle: detalle.trim() || null,
      });
      setResult(moved);
    } catch (err) {
      setError(err.message ?? 'No se pudieron registrar los movimientos.');
    } finally {
      setSaving(false);
    }
  }

  if (result != null) {
    return (
      <div className="bulk-move__overlay" role="dialog" aria-modal="true">
        <div className="bulk-move">
          <header className="bulk-move__header">
            <h2>Movimiento masivo</h2>
            <button type="button" className="bulk-move__close" onClick={onClose} aria-label="Cerrar">
              ×
            </button>
          </header>
          <div className="bulk-move__body">
            <p className="bulk-move__result">
              {result === 0
                ? 'Ningún animal se movió (todos ya estaban en ese potrero o no están activos).'
                : `${result} animal${result !== 1 ? 'es' : ''} movido${result !== 1 ? 's' : ''} exitosamente.`}
            </p>
          </div>
          <footer className="bulk-move__footer">
            <button type="button" className="bulk-move__save" onClick={onClose}>
              Cerrar
            </button>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-move__overlay" role="dialog" aria-modal="true">
      <div className="bulk-move">
        <header className="bulk-move__header">
          <h2>Mover {animalIds.length} animal{animalIds.length !== 1 ? 'es' : ''}</h2>
          <button type="button" className="bulk-move__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>

        <div className="bulk-move__body">
          <label className="bulk-move__field">
            <span>Potrero destino *</span>
            <select value={potreroDestinoId} onChange={(e) => setPotreroDestinoId(e.target.value)}>
              <option value="">Selecciona…</option>
              {(potreros ?? []).map((p) => (
                <option key={p.client_id} value={p.client_id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="bulk-move__field">
            <span>Fecha</span>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>

          <label className="bulk-move__field">
            <span>Detalle (opcional)</span>
            <textarea
              rows={2}
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Motivo del movimiento…"
            />
          </label>

          {error && (
            <p className="bulk-move__error" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className="bulk-move__footer">
          <button type="button" className="bulk-move__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="bulk-move__save" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Moviendo…' : 'Mover'}
          </button>
        </footer>
      </div>
    </div>
  );
}
