import { useSyncStatus } from '../../hooks/useSyncStatus.js';
import './SyncStatus.css';

function formatLastPullAt(iso) {
  if (!iso) return 'Sin sincronizar aún';
  return `Última sync: ${new Date(iso).toLocaleTimeString()}`;
}

export function SyncStatus() {
  const { isOnline, pendingCount, isSyncing, lastPullAt, syncNow } = useSyncStatus();

  if (pendingCount > 0) {
    return (
      <div className="sync-status" data-online={isOnline}>
        <span
          className={`sync-status__dot ${isOnline ? 'sync-status__dot--online' : 'sync-status__dot--offline'}`}
          aria-hidden="true"
        />
        <span className="sync-status__label">{isOnline ? 'En línea' : 'Sin conexión'}</span>
        <span className="sync-status__pending">{pendingCount} por sincronizar</span>
      </div>
    );
  }

  return (
    <div className="sync-status" data-online={isOnline}>
      <span
        className={`sync-status__dot ${isOnline ? 'sync-status__dot--online' : 'sync-status__dot--offline'}`}
        aria-hidden="true"
      />
      <span className="sync-status__label">{isOnline ? 'En línea' : 'Sin conexión'}</span>
      <span className="sync-status__synced">Sincronizado</span>
    </div>
  );
}
