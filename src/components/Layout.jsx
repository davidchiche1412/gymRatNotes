import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTimer } from '../context/TimerContext';
import RestTimer from './RestTimer';

const navItems = [
  { path: '/', key: 'today', icon: '🏋️' },
  { path: '/history', key: 'history', icon: '📊' },
  { path: '/routines', key: 'routines', icon: '📋' },
  { path: '/profile', key: 'profile', icon: '👤' },
];

export default function Layout() {
  const { t } = useTranslation();
  const { timerSeconds, timerKey, soundEnabled, dismissTimer } = useTimer();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleReady = () => {
      setInstallPrompt(window.__pwaInstallPrompt);
      setShowInstallBanner(true);
    };
    if (window.__pwaInstallPrompt) handleReady();
    window.addEventListener('pwainstallready', handleReady);
    return () => window.removeEventListener('pwainstallready', handleReady);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      window.__pwaInstallPrompt = null;
    }
  };

  return (
    <div className="flex flex-col h-full text-text">
      {showInstallBanner && installPrompt && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-primary text-white text-sm">
          <span className="font-medium">Instalar GymRat Notes</span>
          <div className="flex gap-2">
            <button onClick={() => setShowInstallBanner(false)} className="px-3 py-1 rounded-lg text-white/70 text-xs">Ahora no</button>
            <button onClick={handleInstall} className="px-3 py-1 bg-white text-primary rounded-lg font-semibold text-xs">Instalar</button>
          </div>
        </div>
      )}
      <main className="flex-1 overflow-y-auto pb-20 no-scrollbar">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-surface backdrop-blur-lg border-t border-border pb-safe z-50">
        <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
          {navItems.map(item => (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-text-secondary'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{t(`nav.${item.key}`)}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      {timerSeconds !== null && (
        <RestTimer
          key={timerKey}
          seconds={timerSeconds}
          soundEnabled={soundEnabled}
          onDismiss={dismissTimer}
        />
      )}
    </div>
  );
}
