import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function TopBar({ title, back = false, right = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const showBack = back && location.pathname !== '/';

  return (
    <header className="sticky top-0 z-30 bg-[#fafafa]/85 dark:bg-surface-dark/85 backdrop-blur border-b border-slate-200/70 dark:border-slate-800/70 safe-top">
      <div className="max-w-xl mx-auto flex items-center gap-2 px-4 py-3">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="-ml-2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : null}
        <h1 className="text-base font-semibold flex-1 truncate">{title}</h1>
        {right}
      </div>
    </header>
  );
}
