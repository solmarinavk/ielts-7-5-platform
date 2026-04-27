import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ensureSettings } from './hooks/useSettings.js';
import { getStreak } from './lib/db.js';
import './styles/globals.css';

async function bootstrap() {
  // Idempotent: creates default rows on first launch.
  await Promise.all([ensureSettings(), getStreak()]);

  // Honor stored theme preference before first paint.
  try {
    const saved = localStorage.getItem('ielts.theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (saved !== 'light' && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch {
    // Storage may be blocked (private mode); fall back to system default.
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}

bootstrap();
