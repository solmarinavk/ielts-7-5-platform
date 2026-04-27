import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { useSettings } from '../hooks/useSettings.js';
import { useDailyPlan } from '../hooks/useDailyPlan.js';
import { daysUntil, todayKey } from '../lib/plan-generator.js';
import TopBar from '../components/TopBar.jsx';
import StreakBadge from '../components/StreakBadge.jsx';
import EnergyMeter from '../components/EnergyMeter.jsx';
import DayCard from '../components/DayCard.jsx';
import ResourceOfDay from '../components/ResourceOfDay.jsx';
import TodaysReview from '../components/TodaysReview.jsx';
import { useHomeStats } from '../hooks/useHomeStats.js';
import { Settings as SettingsIcon, Calendar, AlertCircle } from 'lucide-react';

function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 19) return 'Good afternoon';
  return 'Good evening';
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
  const dateLabel = format(parseISO(todayKey()), 'EEEE, MMMM d');

  return (
    <>
      <TopBar
        title="Today"
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
                {remaining >= 0 ? `${remaining}d to exam` : 'Exam passed'}
              </span>
            ) : null}
          </div>
        </div>

        {!examDate ? (
          <div className="card p-4 flex items-start gap-3 border-warning/30 bg-warning/5">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Set your exam date</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                I need your exam date to generate your 45-day plan.
              </p>
              <button
                onClick={() => navigate('/settings')}
                className="btn-primary mt-3 text-xs"
              >
                Go to Settings
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

        {today ? <ResourceOfDay phase={today.phase} date={todayKey()} /> : null}

        <TodaysReview />

        <QuickStats />
      </main>
    </>
  );
}

function OutOfPlanCard({ remaining }) {
  const message =
    remaining === null
      ? 'No plan available for today.'
      : remaining > 45
        ? `${remaining} days until your exam. The plan starts 45 days out.`
        : remaining < 0
          ? 'Your exam date has passed. Reset it in Settings.'
          : 'No plan generated for today. Re-generate the plan in Settings.';
  return (
    <div className="card p-4 text-sm text-slate-600 dark:text-slate-300">{message}</div>
  );
}

function QuickStats() {
  const navigate = useNavigate();
  const stats = useHomeStats();

  const vocab = stats?.vocabDue ?? null;
  const errs = stats?.openErrors ?? null;
  const mockHint = (() => {
    if (!stats) return '…';
    if (!stats.nextMock) return 'none scheduled';
    const days = differenceInCalendarDays(parseISO(stats.nextMock.date), new Date());
    if (days <= 0) return 'today';
    if (days === 1) return 'tomorrow';
    return `in ${days}d`;
  })();
  const mockValue = stats?.nextMock
    ? format(parseISO(stats.nextMock.date), 'MMM d')
    : '—';

  return (
    <section className="grid grid-cols-3 gap-3">
      <StatTile
        label="Today's vocab"
        value={vocab ?? '—'}
        hint={vocab === null ? '…' : vocab === 0 ? 'all caught up' : 'cards due'}
        onClick={() => navigate('/vocab')}
      />
      <StatTile
        label="Open errors"
        value={errs ?? '—'}
        hint={errs === null ? '…' : errs === 0 ? 'log clean' : 'in error log'}
        onClick={() => navigate('/errors')}
      />
      <StatTile
        label="Next mock"
        value={mockValue}
        hint={mockHint}
        onClick={() => navigate('/mocks')}
      />
    </section>
  );
}

function StatTile({ label, value, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card p-3 text-left active:scale-[0.98] transition"
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="text-lg font-mono font-semibold mt-1">{value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>
    </button>
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
