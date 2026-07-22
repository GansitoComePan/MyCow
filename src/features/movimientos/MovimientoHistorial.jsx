import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMovimientos } from './useMovimientos.js';
import { db as defaultDb } from '../../sync/db.js';
import { formatDate } from '../../utils.js';
import { RevertirMovimientoModal } from './RevertirMovimientoModal.jsx';
import './MovimientoHistorial.css';

/**
 * Historial de movimientos de un animal, más reciente primero. NULL de
 * origen se muestra como "Alta" (primer movimiento del animal).
 */
export function MovimientoHistorial({ db = defaultDb, animalClientId }) {
  const { movimientos, isLoading } = useMovimientos(animalClientId, db);
  const [reverting, setReverting] = useState(null);

  const animal = useLiveQuery(() => db.animales.get(animalClientId), [db, animalClientId]);

  if (isLoading) {
    return <p className="movimiento-historial__status">Cargando movimientos…</p>;
  }
  if (movimientos.length === 0) {
    return <p className="movimiento-historial__status">Sin movimientos registrados.</p>;
  }

  return (
    <>
      <ul className="movimiento-historial">
        {movimientos.map((m) => {
          const esActual = animal?.potrero_actual_id === m.potrero_destino_id;
          const puedeRevertir = esActual && !m.revertido_en && m.potrero_origen_id != null;

          return (
            <li key={m.client_id} className="movimiento-historial__row">
              <span className="movimiento-historial__fecha">{formatDate(m.fecha)}</span>
              <span className="movimiento-historial__ruta">
                {m.potrero_origen_nombre ?? 'Alta'} → {m.potrero_destino_nombre}
                {m.revertido_en && <span className="movimiento-historial__badge">Revertido</span>}
              </span>
              {m.detalle && (
                <span className="movimiento-historial__detalle">{m.detalle}</span>
              )}
              {puedeRevertir && (
                <button
                  type="button"
                  className="movimiento-historial__revert"
                  onClick={() => setReverting(m)}
                >
                  Revertir
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {reverting && (
        <RevertirMovimientoModal
          db={db}
          movimiento={reverting}
          onClose={() => setReverting(null)}
        />
      )}
    </>
  );
}
