import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const BASE = import.meta.env.BASE_URL;

// AudioContext compartido (se reutiliza)
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Reanudar si está suspendido (restricción de autoplay)
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume();
  }
  return _audioCtx;
}

function playDing(vol) {
  const audio = new Audio(BASE + 'ding.mp3');
  audio.volume = vol;
  audio.play().catch(() => {});
}

function playBell(vol) {
  try {
    const ctx = getAudioCtx();
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);
    const now = ctx.currentTime;

    // Primer golpe
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 340;
    g1.gain.setValueAtTime(0.6, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc1.connect(g1);
    g1.connect(master);
    osc1.start(now);
    osc1.stop(now + 1.2);

    // Segundo golpe programado con Web Audio (sin setTimeout)
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 340;
    g2.gain.setValueAtTime(0.0, now);
    g2.gain.setValueAtTime(0.5, now + 0.3);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    osc2.connect(g2);
    g2.connect(master);
    osc2.start(now + 0.3);
    osc2.stop(now + 1.3);
  } catch {}
}

function playBeep(vol) {
  try {
    const ctx = getAudioCtx();
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);
    const now = ctx.currentTime;

    [0, 0.2, 0.4].forEach(offset => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 1000;
      g.gain.setValueAtTime(0.2, now + offset);
      g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
      osc.connect(g);
      g.connect(master);
      osc.start(now + offset);
      osc.stop(now + offset + 0.15);
    });
  } catch {}
}

export function playSound(soundType, vol = 0.7) {
  switch (soundType) {
    case 'ding': playDing(vol); break;
    case 'bell': playBell(vol); break;
    case 'beep': playBeep(vol); break;
    default: break;
  }
}

export default function RestTimer({ seconds, soundType = 'none', volume = 0.7, onDismiss }) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(seconds);
  const startRef = useRef(Date.now());
  const totalRef = useRef(seconds);

  useEffect(() => {
    startRef.current = Date.now();
    totalRef.current = seconds;
    setRemaining(seconds);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const left = totalRef.current - elapsed;
      if (left <= 0) {
        setRemaining(0);
        clearInterval(interval);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        if (soundType !== 'none') playSound(soundType, volume);
      } else {
        setRemaining(left);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [seconds]);

  const progress = remaining / totalRef.current;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${mins}:${secs.toString().padStart(2, '0')}`;
  const isFinished = remaining === 0;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto bg-surface border border-border rounded-2xl shadow-lg px-5 py-3 flex items-center gap-4 max-w-sm w-full animate-scale-in">
        {/* Progreso circular */}
        <div className="relative w-12 h-12 flex-shrink-0">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
            <circle
              cx="24" cy="24" r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress)}`}
              strokeLinecap="round"
              className={isFinished ? 'text-green-500' : 'text-primary'}
              style={{ transition: 'stroke-dashoffset 0.3s linear' }}
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${isFinished ? 'text-green-500' : ''}`}>
            {display}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isFinished ? 'text-green-500' : ''}`}>
            {isFinished ? t('timer.ready') : t('timer.resting')}
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="text-text-secondary text-lg px-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
