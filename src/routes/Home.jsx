import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSettings } from '../hooks/useSettings.js';
import { useDailyPlan } from '../hooks/useDailyPlan.js';
import { daysUntil, todayKey } from '../lib/plan-generator.js';
import TopBar from '../components/TopBar.jsx';
import StreakBadge from '../components/StreakBadge.jsx';
import EnergyMeter from '../components/EnergyMeter.jsx';
import DayCard from '../components/DayCard.jsx';
import { Settings as SettingsIcon, Calendar, AlertCircle } from 'lucide-react';

function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Home() {
  const navigate = useNavigate();
  const settings = useSettings();
  const today = useDailyPlan();

  if (settings === undefined) {
    return <SkeletonShell />;
  }

  const examDate = settings?.examDate ?? null;
  const remaining = daysUntil(examDate);
  const dateLabel = format(parseISO(todayKey()), "EEEE d 'de' MMMM", { locale: es });

  return (
    <>
      <TopBar
        title="Hoy"
        right={
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        }
      />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-semibold leading-tight">
              {greet()}, {settings?.name || 'Sol'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <StreakBadge />
            {remaining !== null ? (
              <span className="chip bg-accent/10 text-accent">
                <Calendar className="w-3 h-3" />
                {remaining >= 0 ? `${remaining}d al examen` : 'Examen pasado'}
              </span>
            ) : null}
          </div>
        </div>

        {!examDate ? (
          <div className="card p-4 flex items-start gap-3 border-warning/30 bg-warning/5">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Configurá tu fecha de examen</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Necesito la fecha para generar tu plan de 45 días.
              </p>
              <button
                onClick={() => navigate('/settings')}
                className="btn-primary mt-3 text-xs"
              >
                Ir a Settings
              </button>
            </div>
          </div>
        ) : null}

        <EnergyMeter />

        {today ? (
          <DayCard
            day={today}
            onStart={(route) => navigate(route)}
          />
        ) : examDate ? (
          <OutOfPlanCard remaining={remaining} examDate={examDate} />
        ) : null}

        <QuickStats />
      </main>
    </>
  );
}

function OutOfPlanCard({ remaining }) {
  const message =
    remaining === null
      ? 'Sin plan disponible para hoy.'
      : remaining > 45
        ? `Faltan ${remaining} días para el examen. El plan arranca a 45 días.`
        : remaining < 0
          ? 'El examen ya pasó. Resetea la fecha en Settings.'
          : 'No hay plan generado para hoy. Volvé a generar el plan en Settings.';
  return (
    <div className="card p-4 text-sm text-slate-600 dark:text-slate-300">{message}</div>
  );
}

function QuickStats() {
  return (
    <section className="grid grid-cols-3 gap-3">
      <StatTile label="Vocab hoy" value="—" hint="próx. sprint" />
      <StatTile label="Errores abiertos" value="—" hint="próx. sprint" />
      <StatTile label="Próx. mock" value="—" hint="próx. sprint" />
    </section>
  );
}

function StatTile({ label, value, hint }) {
  return (
    <div className="card p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="text-lg font-mono font-semibold mt-1">{value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>
    </div>
  );
}

function SkeletonShell() {
  return (
    <main className="max-w-xl mx-auto px-4 pb-28 pt-6 animate-pulse space-y-4">
      <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </main>
  );
}
