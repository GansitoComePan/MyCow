import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SyncContext } from '../../../providers/SyncContext.js';
import { SyncStatus } from '../SyncStatus.jsx';

function renderWithContext(value) {
  return render(
    <MemoryRouter>
      <SyncContext.Provider value={value}>
        <SyncStatus />
      </SyncContext.Provider>
    </MemoryRouter>
  );
}

describe('SyncStatus', () => {
  it('muestra offline con badge de pendientes', () => {
    renderWithContext({ isOnline: false, pendingCount: 3, isSyncing: false, lastPullAt: null, syncNow: vi.fn() });

    expect(screen.getByText('Sin conexión')).toBeInTheDocument();
    expect(screen.getByText('3 por sincronizar')).toBeInTheDocument();
  });

  it('muestra online y sincronizado cuando no hay pendientes', () => {
    renderWithContext({ isOnline: true, pendingCount: 0, isSyncing: false, lastPullAt: null, syncNow: vi.fn() });

    expect(screen.getByText('En línea')).toBeInTheDocument();
    expect(screen.getByText('Sincronizado')).toBeInTheDocument();
  });

  it('muestra el badge con pendientes incluso estando online', () => {
    renderWithContext({ isOnline: true, pendingCount: 5, isSyncing: false, lastPullAt: null, syncNow: vi.fn() });

    expect(screen.getByText('En línea')).toBeInTheDocument();
    expect(screen.getByText('5 por sincronizar')).toBeInTheDocument();
  });
});
