import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function RestTimer({ seconds, onDismiss }) {
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
        // Vibrar si está disponible
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
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
          <p className="text-[11px] text-text-secondary">{t('timer.tapToDismiss')}</p>
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
