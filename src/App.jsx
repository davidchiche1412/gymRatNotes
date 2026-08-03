import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { TimerProvider } from './context/TimerContext';
import { db } from './db/database';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import RoutinesPage from './pages/RoutinesPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    db.userSettings.get('settings').then(s => {
      if (s?.language) i18n.changeLanguage(s.language);
    });
  }, [i18n]);

  return (
    <ThemeProvider>
      <TimerProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/routines" element={<RoutinesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TimerProvider>
    </ThemeProvider>
  );
}
