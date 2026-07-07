import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as defaultDb } from '../../sync/db.js';
import { useSyncStatus } from '../../hooks/useSyncStatus.js';
import { useTheme } from '../../theme/useTheme.js';
import { useAuth } from '../auth/useAuth.js';
import './Settings.css';

function entityLabel(e) {
  return { animales: 'Animal', potreros: 'Potrero', movimientos: 'Movimiento', defunciones: 'Defunción', historial_categoria: 'Ascenso', eventos_reproductivos: 'Evento reprod.', ventas: 'Venta', fotos: 'Foto' }[e] ?? e;
}

function opLabel(o) {
  return { insert: 'Crear', update: 'Editar', delete: 'Retirar' }[o] ?? o;
}

function itemLabel(item) {
  if (item.entity === 'animales' && item.payload?.arete_local) {
    return `Arete ${item.payload.arete_local}`;
  }
  if (item.entity === 'potreros' && item.payload?.nombre) {
    return item.payload.nombre;
  }
  return item.client_id?.slice(0, 8);
}

const ENTITY_ROUTE = {
  animales: '/animales',
  potreros: '/potreros',
  movimientos: '/animales',
  defunciones: '/animales',
  historial_categoria: '/animales',
  eventos_reproductivos: '/animales',
  fotos: '/animales',
  ventas: '/',
};

export function Settings({ db = defaultDb } = {}) {
  const navigate = useNavigate();
  const { isOnline, pendingCount, lastPullAt, syncNow } = useSyncStatus();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const [adminMode, setAdminMode] = useState(() => localStorage.getItem('sync_admin_mode') === 'true');

  const isDark = theme === 'dark' || (!theme && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const pendingItems = useLiveQuery(
    () => db.outbox.where('status').anyOf('pending', 'failed', 'waiting_ref').toArray(),
    [db]
  );

  const handleRetry = useCallback(async (item) => {
    await db.outbox.update(item.id, { status: 'pending', attempts: 0, last_error: null, next_retry_at: null });
  }, [db]);

  const handleRetryAll = useCallback(async () => {
    if (!pendingItems) return;
    for (const item of pendingItems) {
      if (item.status === 'failed') {
        await db.outbox.update(item.id, { status: 'pending', attempts: 0, last_error: null, next_retry_at: null });
      }
    }
  }, [db, pendingItems]);

  const failedCount = pendingItems?.filter((i) => i.status === 'failed').length ?? 0;

  return (
    <section className="settings">
      <h1>Configuración</h1>

      <div className="settings__section">
        <h2 className="settings__section-title">Apariencia</h2>
        <label className="settings__row">
          <span>Modo noche</span>
          <button
            type="button"
            className="settings__toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            <span className={`settings__toggle-knob ${isDark ? 'settings__toggle-knob--on' : ''}`} />
          </button>
        </label>
      </div>

      <div className="settings__section">
        <h2 className="settings__section-title">Sincronización</h2>
        <div className="settings__row">
          <span>Estado</span>
          <span className={`settings__status settings__status--${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? 'En línea' : 'Sin conexión'}
          </span>
        </div>
        {lastPullAt && (
          <div className="settings__row">
            <span>Última sync</span>
            <span className="settings__value">{new Date(lastPullAt).toLocaleTimeString()}</span>
          </div>
        )}

        <label className="settings__row">
          <span>Visualización de rutas</span>
          <button
            type="button"
            className="settings__toggle"
            onClick={() => { const v = !adminMode; setAdminMode(v); localStorage.setItem('sync_admin_mode', v); }}
            aria-label={adminMode ? 'Desactivar visualización de rutas' : 'Activar visualización de rutas'}
          >
            <span className={`settings__toggle-knob ${adminMode ? 'settings__toggle-knob--on' : ''}`} />
          </button>
        </label>

        {pendingCount > 0 && (
          <>
            <div className="settings__row">
              <span>Pendientes</span>
              <button className="settings__pending-btn" onClick={() => setExpanded(!expanded)}>
                {pendingCount} operaciones
                <span className={`settings__arrow ${expanded ? 'settings__arrow--open' : ''}`}>▸</span>
              </button>
            </div>

            {expanded && pendingItems && pendingItems.length > 0 && (
              <div className="settings__pending-list">
                {failedCount > 0 && (
                  <button className="settings__retry-all" onClick={handleRetryAll}>
                    Reintentar {failedCount} fallidas
                  </button>
                )}
                <ul>
                  {pendingItems.map((item) => (
                    <li key={item.id} className="settings__pending-item" data-status={item.status}>
                      <button className="settings__item-main" onClick={() => { navigate(ENTITY_ROUTE[item.entity] ?? '/'); }}>
                        <span className="settings__item-op">{opLabel(item.op)}</span>
                        <span className="settings__item-entity">{entityLabel(item.entity)}</span>
                        <span className="settings__item-label">{itemLabel(item)}</span>
                      </button>
                      <div className="settings__item-meta">
                        {item.status === 'failed' && item.last_error && (
                          <span className="settings__item-error" title={item.last_error}>
                            {item.last_error.length > 60 ? item.last_error.slice(0, 60) + '…' : item.last_error}
                          </span>
                        )}
                        {item.status === 'waiting_ref' && (
                          <span className="settings__item-waiting">esperando referencia</span>
                        )}
                        {item.status === 'pending' && (
                          <span className="settings__item-pending">pendiente</span>
                        )}
                        {item.status === 'failed' && (
                          <button className="settings__retry-btn" onClick={() => handleRetry(item)} title="Reintentar">↻</button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {pendingCount === 0 && (
          <div className="settings__row">
            <span>Sincronizado</span>
            <span className="settings__value">Al día</span>
          </div>
        )}
      </div>

      <div className="settings__section">
        <h2 className="settings__section-title">Cuenta</h2>
        <button type="button" className="settings__sign-out" onClick={() => signOut()}>
          Cerrar sesión
        </button>
      </div>
    </section>
  );
}
