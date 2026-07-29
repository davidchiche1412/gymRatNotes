import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Campana tipo ring de boxeo: tono metálico con decay
function playBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    // Tono principal (campana grave)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 340;
    gain1.gain.setValueAtTime(0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 1.2);

    // Armónico metálico
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.value = 680;
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.6);

    // Armónico alto (brillo)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.value = 1020;
    gain3.gain.setValueAtTime(0.08, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now);
    osc3.stop(now + 0.4);

    // Segundo golpe (ring bell = doble)
    setTimeout(() => {
      const ctx2 = new (window.AudioContext || window.webkitAudioContext)();
      const now2 = ctx2.currentTime;
      const o = ctx2.createOscillator();
      const g = ctx2.createGain();
      o.type = 'sine';
      o.frequency.value = 340;
      g.gain.setValueAtTime(0.5, now2);
      g.gain.exponentialRampToValueAtTime(0.001, now2 + 1.0);
      o.connect(g);
      g.connect(ctx2.destination);
      o.start(now2);
      o.stop(now2 + 1.0);
    }, 300);
  } catch {}
}

export default function RestTimer({ seconds, soundEnabled = false, onDismiss }) {
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
        if (soundEnabled) playBell();
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
