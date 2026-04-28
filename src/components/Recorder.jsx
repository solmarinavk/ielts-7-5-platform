import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, Square, Trash2, Save, AlertTriangle } from 'lucide-react';
import { useCountdown, formatMmSs } from '../hooks/useCountdown.js';
import { cn } from '../lib/cn.js';

/**
 * Speech-to-text recorder built on the Web Speech API + MediaRecorder.
 *
 * Browser support is uneven:
 *   - Chrome / Edge / Safari (recent) ship webkitSpeechRecognition.
 *   - Firefox does not ship SpeechRecognition; we still record audio and
 *     render a friendly fallback message under the transcript.
 *
 * Audio capture via MediaRecorder is opt-in: we ask for getUserMedia({audio:
 * true}) only when the user starts the recorder, and we fall back to
 * transcript-only if permission is denied or the API is missing.
 */
export default function Recorder({
  durationSec,
  onSave,
  saving = false,
  hint,
  showSaveButton = true,
}) {
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recState, setRecState] = useState('idle'); // idle | recording | stopped
  const [error, setError] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recogRef = useRef(null);
  const mediaRecRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const finalRef = useRef('');

  const timer = useCountdown({
    durationSec,
    autoStart: false,
    onComplete: () => stop(),
  });

  // Probe SpeechRecognition support up-front so we can render the fallback
  // banner without waiting for the user to hit Start.
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSpeechSupported(false);
  }, []);

  // Cleanup any object URL we created on unmount.
  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, [audioUrl]);

  const start = useCallback(async () => {
    setError(null);
    finalRef.current = '';
    setTranscript('');
    setInterim('');
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    // 1) Try to capture audio. If denied, we degrade to transcript-only.
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunksRef.current = [];
        mediaRecRef.current = new MediaRecorder(streamRef.current);
        mediaRecRef.current.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        mediaRecRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        };
        mediaRecRef.current.start();
      }
    } catch (err) {
      // Permission denied or no mic. Continue with transcript-only.
      setError(`Microphone unavailable: ${err.message || err}. Recording transcript only.`);
    }

    // 2) Start speech recognition if supported.
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const recog = new SR();
      recog.lang = 'en-GB';
      recog.continuous = true;
      recog.interimResults = true;
      recog.onresult = (e) => {
        let interimChunk = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalRef.current += r[0].transcript + ' ';
          else interimChunk += r[0].transcript;
        }
        setTranscript(finalRef.current.trim());
        setInterim(interimChunk);
      };
      recog.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        setError(`Speech recognition: ${e.error}`);
      };
      recog.onend = () => {
        // Auto-restart while recording to handle browsers that close the
        // session after each utterance.
        if (recState === 'recording') {
          try {
            recog.start();
          } catch {
            /* already started */
          }
        }
      };
      recogRef.current = recog;
      recog.start();
    }

    setRecState('recording');
    timer.start();
  }, [audioUrl, timer, recState]);

  const stop = useCallback(() => {
    timer.pause();
    try {
      mediaRecRef.current?.stop();
    } catch {
      /* already stopped */
    }
    try {
      recogRef.current?.stop();
    } catch {
      /* already stopped */
    }
    recogRef.current = null;
    setRecState('stopped');
    setInterim('');
  }, [timer]);

  const discard = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setTranscript('');
    setInterim('');
    setAudioBlob(null);
    setAudioUrl(null);
    finalRef.current = '';
    setError(null);
    setRecState('idle');
    timer.reset();
  }, [audioUrl, timer]);

  function save() {
    onSave?.({
      transcript: transcript.trim(),
      audioBlob,
      durationSec: (durationSec ?? 0) - timer.remaining,
    });
  }

  const danger = timer.remaining <= 10 && recState === 'recording';

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'card p-4 flex items-center justify-between',
          recState === 'recording' && 'ring-2 ring-danger/40',
        )}
      >
        <div>
          <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {recState === 'recording' ? 'Recording' : recState === 'stopped' ? 'Stopped' : 'Ready'}
          </p>
          <p
            className={cn(
              'text-3xl font-mono font-semibold mt-0.5',
              danger ? 'text-danger' : 'text-slate-900 dark:text-slate-100',
            )}
          >
            {formatMmSs(timer.remaining)}
          </p>
          {hint ? <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</p> : null}
        </div>
        <div className="flex gap-2">
          {recState === 'idle' || recState === 'stopped' ? (
            <button onClick={start} className="btn-primary">
              <Mic className="w-4 h-4" />
              {recState === 'stopped' ? 'Re-record' : 'Start'}
            </button>
          ) : (
            <button onClick={stop} className="btn-outline border-danger/40 text-danger">
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}
        </div>
      </div>

      {!speechSupported ? (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-slate-700 dark:text-slate-200">
            Your browser cannot do live transcription. Try Chrome, Edge or Safari for the
            transcript; audio recording will still work here.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-xs text-warning">
          {error}
        </div>
      ) : null}

      <div className="card p-4 min-h-[140px]">
        <p className="label mb-2">Transcript</p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {transcript ? <span>{transcript}</span> : null}
          {interim ? <span className="text-slate-400 italic"> {interim}</span> : null}
          {!transcript && !interim ? (
            <span className="text-slate-400">
              {recState === 'recording' ? 'Listening…' : 'Hit Start when you are ready.'}
            </span>
          ) : null}
        </p>
      </div>

      {audioUrl ? (
        <div className="card p-3">
          <p className="label mb-2">Playback</p>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      ) : null}

      {recState === 'stopped' && showSaveButton ? (
        <div className="flex gap-2">
          <button onClick={discard} className="btn-outline">
            <Trash2 className="w-4 h-4" /> Discard
          </button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1">
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save recording'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
