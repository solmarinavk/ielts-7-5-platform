import { ExternalLink, FileCheck, PenSquare, Mic, Headphones, BookOpenCheck, MapPin, Tag } from 'lucide-react';
import TopBar from '../components/TopBar.jsx';
import { RESOURCE_CATEGORIES, getByCategory } from '../lib/resources.js';
import { cn } from '../lib/cn.js';

const ICONS = { FileCheck, PenSquare, Mic, Headphones, BookOpenCheck, MapPin };

export default function Resources() {
  return (
    <>
      <TopBar title="Resources" back />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-3 space-y-5 animate-fade-in">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Curated IELTS resources. Items marked
          <span className="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 mx-1">free</span>
          have no paywall.
        </p>
        {RESOURCE_CATEGORIES.map((cat) => (
          <CategorySection key={cat.id} category={cat} />
        ))}
      </main>
    </>
  );
}

function CategorySection({ category }) {
  const Icon = ICONS[category.icon] ?? Tag;
  const items = getByCategory(category.id);
  if (!items.length) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </span>
        <h2 className="text-sm font-semibold">{category.label}</h2>
        <span className="text-[11px] text-slate-400">{items.length}</span>
      </div>
      <ul className="space-y-2">
        {items.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </ul>
    </section>
  );
}

function ResourceCard({ resource }) {
  return (
    <li className="card p-3.5">
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold leading-tight">{resource.title}</span>
            {resource.free ? (
              <span className="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">free</span>
            ) : (
              <span className="chip bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">paid</span>
            )}
            {resource.urlVerified === false ? (
              <span
                className="chip bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                title="URL pending verification"
              >verify link</span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{resource.description}</p>
          {resource.skill?.length ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {resource.skill.map((s) => (
                <span
                  key={s}
                  className={cn(
                    'chip border text-[10px]',
                    'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400',
                  )}
                >{s}</span>
              ))}
            </div>
          ) : null}
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      </a>
    </li>
  );
}
