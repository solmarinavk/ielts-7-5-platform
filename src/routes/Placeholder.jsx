import TopBar from '../components/TopBar.jsx';
import { Construction } from 'lucide-react';

export default function Placeholder({ title, sprint }) {
  return (
    <>
      <TopBar title={title} back />
      <main className="max-w-xl mx-auto px-4 pb-28 pt-6 animate-fade-in">
        <div className="card p-6 text-center space-y-3">
          <Construction className="w-10 h-10 mx-auto text-warning" />
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Under construction. Coming in {sprint}.
          </p>
        </div>
      </main>
    </>
  );
}
