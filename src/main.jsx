import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ensureSettings } from './hooks/useSettings.js';
import { getStreak, updateSettings } from './lib/db.js';
import { generateAndPersistPlan } from './lib/plan-generator.js';
import { seedVocabIfEmpty } from './lib/vocab-seed.js';
import './styles/globals.css';

// v3 introduces the adaptive plan shape (standard / compressed / minimal),
// so any plan persisted under v1 (Spanish) or v2 (English fixed-45) gets
// re-materialised on first load. Block completion state is preserved.
const PLAN_LANG_VERSION = 3;

async function bootstrap() {
  // Idempotent: creates default rows on first launch. Each step is wrapped
  // so one bad row in any table can't keep the app from booting; the user
  // can still reach /settings → recovery options.
  try {
    await Promise.all([ensureSettings(), getStreak(), seedVocabIfEmpty()]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Bootstrap step failed (non-fatal):', err);
  }

  // Silent migration: if an existing plan was generated under an older
  // template, re-materialise it. generateAndPersistPlan preserves per-block
  // completion state by date. If migration itself throws, swallow the error
  // and let the app render — the user can re-generate manually from Settings.
  try {
    const settings = await ensureSettings();
    if (settings?.examDate && (settings.planLangVersion ?? 1) < PLAN_LANG_VERSION) {
      await generateAndPersistPlan(settings.examDate);
      await updateSettings({ planLangVersion: PLAN_LANG_VERSION });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Plan migration failed (non-fatal):', err);
  }

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
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}

bootstrap();
