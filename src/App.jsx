import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { TimerProvider } from './context/TimerContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import { useSettings } from './hooks/useSettings';

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

export default function App() {
  const { i18n } = useTranslation();
  const { settings } = useSettings();

  useEffect(() => {
    i18n.changeLanguage(settings.language);
  }, [i18n, settings.language]);

  return (
    <ThemeProvider>
      <TimerProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/history" element={lazyPage(<HistoryPage />)} />
              <Route path="/routines" element={lazyPage(<RoutinesPage />)} />
              <Route path="/profile" element={lazyPage(<ProfilePage />)} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TimerProvider>
    </ThemeProvider>
  );
}
