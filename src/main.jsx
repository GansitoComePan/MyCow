import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App.jsx';
import { db } from './sync/db.js';
import { seedDemoData, clearAll } from './seed.js';
import './theme/tokens.css';
window.__db = db;
window.__seed = () => seedDemoData(db);
window.__clear = () => clearAll(db);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
