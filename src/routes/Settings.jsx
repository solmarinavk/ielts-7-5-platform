import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { useSettings } from '../hooks/useSettings.js';
import { updateSettings, clearAllData } from '../lib/db.js';
import { generateAndPersistPlan } from '../lib/plan-generator.js';
import TopBar from '../components/TopBar.jsx';
import { Save, Trash2, RefreshCw, Sun, Moon, Monitor } from 'lucide-react';

const SECTIONS = ['listening', 'reading', 'writing', 'speaking'];
const BAND_OPTIONS = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

export default function Settings() {
  const navigate = useNavigate();
  const settings = useSettings();
  const [form, setForm] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (settings && !form) {
      setForm({
        name: settings.name || 'Sol',
        examDate: settings.examDate || format(addDays(new Date(), 45), 'yyyy-MM-dd'),
        targetBand: settings.targetBand ?? 7.5,
        sectionTargets: settings.sectionTargets || {
          listening: 7.5,
          reading: 7.5,
          writing: 7.0,
          speaking: 7.5,
        },
        baselineBand: settings.baselineBand ?? 6.75,
        theme: settings.theme || 'system',
      });
    }
  }, [settings, form]);

  if (!form) {
    return (
      <>
        <TopBar title="Settings" back />
        <main className="max-w-xl mx-auto px-4 py-6">Loading…</main>
      </>
    );
  }

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function setSectionTarget(section, value) {
    setForm((f) => ({ ...f, sectionTargets: { ...f.sectionTargets, [section]: value } }));
  }

  async function applyTheme(theme) {
    setField('theme', theme);
    try {
      localStorage.setItem('ielts.theme', theme);
    } catch {
      // ignore storage failures
    }
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'light') root.classList.remove('dark');
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }

  async function save() {
    await updateSettings({
      name: form.name,
      examDate: form.examDate,
      targetBand: Number(form.targetBand),
      sectionTargets: form.sectionTargets,
      baselineBand: Number(form.baselineBand),
      theme: form.theme,
    });
    setGenerating(true);
    await generateAndPersistPlan(form.examDate);
    setGenerating(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  async function regeneratePlan() {
    if (!form.examDate) return;
    setGenerating(true);
    await generateAndPersistPlan(form.examDate);
    setGenerating(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  async function resetEverything() {
    const ok = confirm('This will erase EVERYTHING (settings, plan, vocab, mocks, writing, speaking). Continue?');
    if (!ok) return;
    await clearAllData();
    navigate('/', { replace: true });
    location.reload();
  }

  return (
    <>
      <TopBar title="Settings" back />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-4 animate-fade-in">
        <section className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Profile</h2>
          <Field label="Name">
            <input
              className="input"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </Field>
        </section>

        <section className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Exam</h2>
          <Field label="Exam date">
            <input
              type="date"
              className="input"
              value={form.examDate}
              onChange={(e) => setField('examDate', e.target.value)}
            />
          </Field>
          <Field label="Target overall band">
            <select
              className="input"
              value={form.targetBand}
              onChange={(e) => setField('targetBand', e.target.value)}
            >
              {BAND_OPTIONS.map((b) => (
                <option key={b} value={b}>{b.toFixed(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="Baseline band (estimate)">
            <select
              className="input"
              value={form.baselineBand}
              onChange={(e) => setField('baselineBand', e.target.value)}
            >
              {[5.5, 6.0, 6.5, 6.75, 7.0, 7.5, 8.0].map((b) => (
                <option key={b} value={b}>{Number(b).toFixed(2)}</option>
              ))}
            </select>
          </Field>
        </section>

        <section className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Section targets</h2>
          <div className="grid grid-cols-2 gap-3">
            {SECTIONS.map((s) => (
              <Field key={s} label={s.charAt(0).toUpperCase() + s.slice(1)}>
                <select
                  className="input"
                  value={form.sectionTargets[s]}
                  onChange={(e) => setSectionTarget(s, Number(e.target.value))}
                >
                  {BAND_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b.toFixed(1)}</option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
        </section>

        <section className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Appearance</h2>
          <div className="grid grid-cols-3 gap-2">
            <ThemeBtn icon={Sun} label="Light" active={form.theme === 'light'} onClick={() => applyTheme('light')} />
            <ThemeBtn icon={Moon} label="Dark" active={form.theme === 'dark'} onClick={() => applyTheme('dark')} />
            <ThemeBtn icon={Monitor} label="System" active={form.theme === 'system'} onClick={() => applyTheme('system')} />
          </div>
        </section>

        <div className="flex gap-2">
          <button onClick={save} disabled={generating} className="btn-primary flex-1">
            <Save className="w-4 h-4" />
            {generating ? 'Generating plan…' : savedFlash ? 'Saved' : 'Save and generate plan'}
          </button>
        </div>

        <section className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Plan</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The plan covers the 45 days before your exam date. Re-generating keeps your completed-block progress.
          </p>
          <button onClick={regeneratePlan} disabled={generating} className="btn-outline w-full">
            <RefreshCw className="w-4 h-4" /> Re-generate plan
          </button>
        </section>

        <section className="card p-4 border-danger/40 space-y-3">
          <h2 className="text-sm font-semibold text-danger">Danger zone</h2>
          <button onClick={resetEverything} className="btn-outline w-full text-danger border-danger/50">
            <Trash2 className="w-4 h-4" /> Erase all local data
          </button>
        </section>
      </main>
    </>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label block mb-1">{label}</span>
      {children}
    </label>
  );
}

function ThemeBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        'flex flex-col items-center gap-1 py-3 rounded-xl border text-xs transition active:scale-[0.97] ' +
        (active
          ? 'border-accent bg-accent/10 text-slate-900 dark:text-slate-100'
          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800')
      }
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
