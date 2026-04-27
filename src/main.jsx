import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ensureSettings } from './hooks/useSettings.js';
import { getStreak, updateSettings } from './lib/db.js';
import { generateAndPersistPlan } from './lib/plan-generator.js';
import { seedVocabIfEmpty } from './lib/vocab-seed.js';
import './styles/globals.css';

const PLAN_LANG_VERSION = 2;

async function bootstrap() {
  // Idempotent: creates default rows on first launch.
  await Promise.all([ensureSettings(), getStreak(), seedVocabIfEmpty()]);

  // Silent migration: if an existing plan was generated under the old Spanish
  // template, re-materialise it in English. generateAndPersistPlan preserves
  // per-block completion state, so user progress is not lost.
  const settings = await ensureSettings();
  if (settings.examDate && (settings.planLangVersion ?? 1) < PLAN_LANG_VERSION) {
    await generateAndPersistPlan(settings.examDate);
    await updateSettings({ planLangVersion: PLAN_LANG_VERSION });
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
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}

bootstrap();
