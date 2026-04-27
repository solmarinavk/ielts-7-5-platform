import { useEffect, useState } from 'react';
import { Share, Plus, X } from 'lucide-react';

const DISMISS_KEY = 'ielts.installPromptDismissedAt';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIOS() || isStandalone()) return;
    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return;
    } catch {
      // storage blocked: still show
    }
    setVisible(true);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 px-4 animate-slide-up">
      <div className="max-w-xl mx-auto card p-3 flex items-start gap-3 shadow-lg">
        <div className="flex-1 text-xs text-slate-700 dark:text-slate-200">
          <p className="font-semibold mb-1">Install IELTS 7.5 on your home screen</p>
          <p className="text-slate-500 dark:text-slate-400 leading-snug">
            In Safari, tap <Share className="inline w-3.5 h-3.5 mx-0.5" /> Share and then{' '}
            <Plus className="inline w-3.5 h-3.5 mx-0.5" /> Add to Home Screen.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
