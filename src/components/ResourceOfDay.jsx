import { ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getResourceOfDay } from '../lib/resources.js';

export default function ResourceOfDay({ phase, date }) {
  const resource = getResourceOfDay(phase, date);
  if (!resource) return null;

  return (
    <section className="card p-4">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <h2 className="text-sm font-semibold">Resource of the day</h2>
            {resource.free ? (
              <span className="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">free</span>
            ) : null}
          </div>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm font-medium text-accent hover:underline truncate"
          >
            {resource.title} <ExternalLink className="inline w-3 h-3 -mt-0.5" />
          </a>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-1">{resource.description}</p>
          <Link
            to="/resources"
            className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-accent inline-block mt-2"
          >
            Browse all resources →
          </Link>
        </div>
      </div>
    </section>
  );
}
