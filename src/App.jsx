import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { TimerProvider } from './context/TimerContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import { useSettings } from './hooks/useSettings';
import { sync, initialPushAll, initialPullAll } from './db/sync';
import { logError } from './utils/logger';

const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const RoutinesPage = lazy(() => import('./pages/routines/RoutinesPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));

function PageFallback() {
  return (
    <div className="p-4 max-w-lg mx-auto text-sm text-text-secondary">
      ...
    </div>
  );
}

function lazyPage(page) {
  return (
    <Suspense fallback={<PageFallback />}>
      {page}
    </Suspense>
  );
}

function AppContent() {
  const { i18n } = useTranslation();
  const { settings } = useSettings();
  const { user } = useAuth();
  const prevUserRef = useRef(undefined);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    i18n.changeLanguage(settings.language);
  }, [i18n, settings.language]);

  // Auth sync: primer login sube datos locales y descarga datos remotos
  useEffect(() => {
    if (user === undefined) return; // todavía cargando

    const prev = prevUserRef.current;
    prevUserRef.current = user;

    if (!user) return; // sin sesión

    if (prev === undefined || prev === null) {
      // Acaban de hacer login: primero pull (prioridad remoto) luego push local nuevo
      initialPullAll(user.id)
        .then(() => initialPushAll(user.id))
        .catch(e => logError('sync', e));
    } else {
      // Sesión ya activa: sync incremental
      sync(user.id).catch(e => logError('sync', e));
    }
  }, [user]);

  // Sync al recuperar conexión
  useEffect(() => {
    const onOnline = () => {
      if (user?.id) sync(user.id).catch(e => logError('sync', e));
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [user]);

  // Sync periódico cada 5 min cuando hay sesión y conexión
  useEffect(() => {
    if (!user?.id) return;
    const id = setInterval(() => {
      if (navigator.onLine) sync(user.id).catch(e => logError('sync', e));
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [user]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout onShowLogin={() => setShowLogin(true)} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={lazyPage(<HistoryPage />)} />
          <Route path="/routines" element={lazyPage(<RoutinesPage />)} />
          <Route path="/profile" element={lazyPage(<ProfilePage onShowLogin={() => setShowLogin(true)} />)} />
        </Route>
      </Routes>
      {showLogin && <LoginPage onClose={() => setShowLogin(false)} />}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TimerProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </TimerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
