import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import StatsSection from './StatsSection';
import MeasurementsSection from './MeasurementsSection';
import SettingsSection from './SettingsSection';
import { useAuth } from '../../context/useAuth';

export default function ProfilePage({ onShowLogin }) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState('stats');

  const tabs = [
    { key: 'stats', label: t('profile.stats') },
    { key: 'measurements', label: t('profile.measurements') },
    { key: 'settings', label: t('profile.settings') },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">{t('profile.title')}</h1>
        {user ? (
          <button
            onClick={signOut}
            className="text-xs text-text-secondary border border-border px-2 py-1 rounded-lg hover:border-danger/40 hover:text-danger transition-colors"
          >
            {t('auth.signOut')}
          </button>
        ) : (
          <button
            onClick={onShowLogin}
            className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium"
          >
            {t('auth.login')}
          </button>
        )}
      </div>

      {user && (
        <p className="text-xs text-text-secondary mb-3">
          ☁️ {user.email}
        </p>
      )}

      <div className="flex gap-1 bg-bg rounded-xl p-1 mb-4 border border-border">
        {tabs.map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb.key ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'}`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <StatsSection />}
      {tab === 'measurements' && <MeasurementsSection />}
      {tab === 'settings' && <SettingsSection />}
    </div>
  );
}
