import React from 'react';

/**
 * Top-level safety net so a render error in any route never bricks the app.
 *
 * The app is offline-first with all state in IndexedDB; if a component
 * crashes (e.g. a future migration leaves a row without an expected field),
 * we want the user to be able to reach Settings → Danger zone → Reset plan
 * or Import backup, rather than having to clear site data and lose progress.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface in the console for the report-it-to-claude workflow.
    // eslint-disable-next-line no-console
    console.error('App-level error caught:', error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const message = String(this.state.error?.message || this.state.error || 'Unknown error');

    return (
      <main className="min-h-full flex items-start justify-center px-4 py-10 bg-[#fafafa] dark:bg-surface-dark">
        <div className="max-w-md w-full card p-5 space-y-4 animate-fade-in">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-danger">
              Something broke
            </p>
            <h1 className="text-base font-semibold">The app caught a render error</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Your local data has not been touched. You can try to reload, or go to Settings to
              reset the plan only / restore from a backup without losing your vocab, mocks or
              error log.
            </p>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-slate-500 dark:text-slate-400">
              Error details
            </summary>
            <pre className="mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-auto text-[11px] leading-snug whitespace-pre-wrap">
              {message}
            </pre>
          </details>

          <div className="grid gap-2">
            <button
              onClick={() => {
                this.reset();
                window.location.reload();
              }}
              className="btn-primary"
            >
              Reload app
            </button>
            <button
              onClick={() => {
                this.reset();
                window.location.assign('/settings');
              }}
              className="btn-outline"
            >
              Go to Settings (recovery)
            </button>
          </div>
        </div>
      </main>
    );
  }
}
