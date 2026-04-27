import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, AlertTriangle } from 'lucide-react';
import { useRecycledErrors } from '../hooks/useHomeStats.js';
import { db } from '../lib/db.js';
import { SECTION_LABEL } from '../lib/ielts-bands.js';

export default function TodaysReview() {
  const navigate = useNavigate();
  const errors = useRecycledErrors(3);

  if (!errors || errors.length === 0) return null;

  async function markReviewed(error) {
    await db.errorLog.put({
      ...error,
      status: 'reviewed',
      reviewCount: (error.reviewCount ?? 0) + 1,
      lastReviewedAt: new Date().toISOString(),
    });
  }

  return (
    <section className="card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between bg-warning/10 border-b border-warning/20">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h2 className="text-sm font-semibold">Today's review</h2>
        </div>
        <button
          onClick={() => navigate('/errors')}
          className="text-xs text-slate-500 hover:text-accent inline-flex items-center"
        >
          All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {errors.map((er) => (
          <li key={er.id} className="px-3 py-2.5 flex items-start gap-3">
            <button
              onClick={() => markReviewed(er)}
              className="shrink-0 w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600 hover:border-accent flex items-center justify-center"
              aria-label="Mark reviewed"
            >
              <Check className="w-4 h-4 text-slate-400" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {SECTION_LABEL[er.skill] || er.skill}
                </span>
                {er.questionType ? (
                  <span className="text-[10px] text-slate-400">{er.questionType}</span>
                ) : null}
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-100 leading-snug">
                {er.description}
              </p>
              {er.fixStrategy ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{er.fixStrategy}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
