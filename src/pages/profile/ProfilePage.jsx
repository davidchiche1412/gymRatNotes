import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import StatsSection from './StatsSection';
import MeasurementsSection from './MeasurementsSection';
import SettingsSection from './SettingsSection';

export default function ProfilePage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('stats');

  const tabs = [
    { key: 'stats', label: t('profile.stats') },
    { key: 'measurements', label: t('profile.measurements') },
    { key: 'settings', label: t('profile.settings') },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">{t('profile.title')}</h1>

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
