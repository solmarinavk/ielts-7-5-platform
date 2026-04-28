import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Lightweight countdown timer used by Writing and Speaking.
 *
 * - durationSec: total seconds to count down from
 * - autoStart: begin running on mount
 * - onComplete: called once when remaining hits 0
 *
 * Returns { remaining, running, start, pause, reset, set }.
 * Updates roughly once per second via setInterval. The hook tolerates
 * tab-throttling: we recompute remaining from a fixed deadline rather than
 * decrementing, so leaving the tab in the background does not lose seconds.
 */
export function useCountdown({ durationSec, autoStart = false, onComplete } = {}) {
  const [remaining, setRemaining] = useState(durationSec ?? 0);
  const [running, setRunning] = useState(autoStart);
  const deadlineRef = useRef(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!running) return;
    if (deadlineRef.current === null) {
      deadlineRef.current = Date.now() + remaining * 1000;
    }
    const tick = () => {
      const left = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !completedRef.current) {
        completedRef.current = true;
        setRunning(false);
        onCompleteRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running]); // remaining intentionally omitted: deadline is the source of truth.

  const start = useCallback(() => {
    if (completedRef.current) {
      completedRef.current = false;
      setRemaining(durationSec ?? 0);
      deadlineRef.current = Date.now() + (durationSec ?? 0) * 1000;
    } else {
      deadlineRef.current = Date.now() + remaining * 1000;
    }
    setRunning(true);
  }, [durationSec, remaining]);

  const pause = useCallback(() => {
    deadlineRef.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback(
    (newDurationSec) => {
      const next = newDurationSec ?? durationSec ?? 0;
      setRemaining(next);
      deadlineRef.current = null;
      setRunning(false);
      completedRef.current = false;
    },
    [durationSec],
  );

  const set = useCallback((sec) => {
    setRemaining(sec);
    deadlineRef.current = Date.now() + sec * 1000;
    completedRef.current = false;
  }, []);

  return { remaining, running, start, pause, reset, set };
}

export function formatMmSs(totalSec) {
  const safe = Math.max(0, Math.floor(totalSec ?? 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
