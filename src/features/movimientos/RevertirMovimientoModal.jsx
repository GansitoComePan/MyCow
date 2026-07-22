import { useState } from 'react';
import { db as defaultDb } from '../../sync/db.js';
import { revertirMovimiento } from './useMovimientoMutations.js';
import './RevertirMovimientoModal.css';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function RevertirMovimientoModal({ db = defaultDb, movimiento, onClose }) {
  const [fecha, setFecha] = useState(todayIso);
  const [detalle, setDetalle] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleRevert() {
    setError(null);
    setSaving(true);
    try {
      await revertirMovimiento(db, movimiento.client_id, {
        fecha,
        detalle: detalle.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err.message ?? 'No se pudo revertir el movimiento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="revertir-overlay" role="dialog" aria-modal="true">
      <div className="revertir-modal">
        <header className="revertir-modal__header">
          <h2>Revertir movimiento</h2>
          <button type="button" className="revertir-modal__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>

        <div className="revertir-modal__body">
          <p className="revertir-modal__summary">
            Se creará un movimiento inverso que devolverá al animal a su potrero de origen.
          </p>

          <label className="revertir-modal__field">
            <span>Fecha del reverso</span>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>

          <label className="revertir-modal__field">
            <span>Motivo (opcional)</span>
            <textarea
              rows={2}
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Por qué se revierte…"
            />
          </label>

          {error && (
            <p className="revertir-modal__error" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className="revertir-modal__footer">
          <button type="button" className="revertir-modal__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="revertir-modal__confirm" onClick={handleRevert} disabled={saving}>
            {saving ? 'Revirtiendo…' : 'Revertir'}
          </button>
        </footer>
      </div>
    </div>
  );
}
