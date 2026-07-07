import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthProvider.jsx';
import { useAuth } from './features/auth/useAuth.js';
import { LoginScreen } from './features/auth/LoginScreen.jsx';
import { SyncProvider } from './providers/SyncProvider.jsx';
import { SyncStatus } from './components/SyncStatus/SyncStatus.jsx';
import { AnimalesList } from './features/animales/AnimalesList.jsx';
import { BottomNav } from './components/Navigation/BottomNav.jsx';
import { Dashboard } from './features/dashboard/Dashboard.jsx';
import { PotrerosList } from './features/potreros/PotrerosList.jsx';
import { Reportes } from './features/reportes/Reportes.jsx';
import { Calendario } from './features/calendario/Calendario.jsx';
import { Settings } from './features/settings/Settings.jsx';
import './App.css';

function AppRoutes({ db }) {
  return (
    <Routes>
      <Route path="/" element={<Dashboard db={db} />} />
      <Route path="/animales" element={<AnimalesList db={db} />} />
      <Route path="/potreros" element={<PotrerosList db={db} />} />
      <Route path="/reportes" element={<Reportes />} />
      <Route path="/calendario" element={<Calendario />} />
      <Route path="/configuracion" element={<Settings db={db} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppShell({ db, engine, connectivity }) {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="app__loading">Cargando…</div>;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <SyncProvider db={db} engine={engine} connectivity={connectivity}>
      <div className="app">
        <div className="app__topbar">
          <button type="button" className="app__config-btn" onClick={() => navigate('/configuracion')} aria-label="Configuración">⚙</button>
        </div>
        <SyncStatus />
        <main className="app__content">
          <AppRoutes db={db} />
        </main>
        <BottomNav />
      </div>
    </SyncProvider>
  );
}

export function App({ supabase, db, engine, connectivity }) {
  return (
    <AuthProvider supabase={supabase}>
      <AppShell db={db} engine={engine} connectivity={connectivity} />
    </AuthProvider>
  );
}
