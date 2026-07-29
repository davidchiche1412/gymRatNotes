import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { timerSeconds, timerKey, soundType, volume, dismissTimer } = useTimer();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const touchRef = useRef({ startX: 0, startY: 0 });

  useEffect(() => {
    const handleReady = () => {
      setInstallPrompt(window.__pwaInstallPrompt);
      setShowInstallBanner(true);
    };
    if (window.__pwaInstallPrompt) handleReady();
    window.addEventListener('pwainstallready', handleReady);
    return () => window.removeEventListener('pwainstallready', handleReady);
  }, []);

  // Swipe lateral para navegar entre tabs
  useEffect(() => {
    const handleTouchStart = (e) => {
      // Ignorar si el touch empieza en un input interactivo (sliders, etc)
      const el = e.target;
      const tag = el.tagName;
      const type = el.type;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || type === 'range' || el.closest('input[type="range"]')) {
        touchRef.current.startX = null;
        return;
      }
      // Ignorar si hay un slider activo recientemente
      if (touchRef.current.sliderCooldown) {
        touchRef.current.startX = null;
        return;
      }
      touchRef.current.startX = e.touches[0].clientX;
      touchRef.current.startY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e) => {
      if (touchRef.current.startX === null) return;
      const dx = e.changedTouches[0].clientX - touchRef.current.startX;
      const dy = e.changedTouches[0].clientY - touchRef.current.startY;
      // Solo swipe horizontal significativo
      if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.7) return;

      const currentIdx = navItems.findIndex(item => item.path === location.pathname);
      if (currentIdx === -1) return;

      if (dx < 0 && currentIdx < navItems.length - 1) {
        navigate(navItems[currentIdx + 1].path);
      } else if (dx > 0 && currentIdx > 0) {
        navigate(navItems[currentIdx - 1].path);
      }
    };
    // Cooldown: bloquear swipe 500ms después de tocar un slider
    const handleInputStart = (e) => {
      if (e.target.type === 'range' || e.target.tagName === 'INPUT') {
        touchRef.current.sliderCooldown = true;
      }
    };
    const handleInputEnd = (e) => {
      if (e.target.type === 'range' || e.target.tagName === 'INPUT') {
        setTimeout(() => { touchRef.current.sliderCooldown = false; }, 500);
      }
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('pointerdown', handleInputStart, { passive: true });
    document.addEventListener('pointerup', handleInputEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('pointerdown', handleInputStart);
      document.removeEventListener('pointerup', handleInputEnd);
    };
  }, [location.pathname, navigate]);

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
                `flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                  isActive ? 'text-primary' : 'text-text-secondary hover:text-text'
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
          soundType={soundType}
          volume={volume}
          onDismiss={dismissTimer}
        />
      )}
    </div>
  );
}
