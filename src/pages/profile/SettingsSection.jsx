import { useTranslation } from 'react-i18next';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';
import { playSound } from '../../utils/timerSound';
import { useSettings } from '../../hooks/useSettings';
import { useTimer } from '../../context/useTimer';

export default function SettingsSection() {
  const { t, i18n } = useTranslation();
  const { modal, confirm, alert: showAlert } = useModal();
  const { setRestEnabled: syncTimerRestEnabled } = useTimer();

  const {
    settings,
    changeName,
    changeLanguage,
    changeRestEnabled,
    changeRestSoundType,
    changeRestVolume,
    exportData,
    importData
  } = useSettings();

  const handleNameChange = async (value) => {
    await changeName(value);
  };

  const handleLanguageChange = async (lang) => {
    i18n.changeLanguage(lang);
    await changeLanguage(lang);
  };

  const handleRestEnabledChange = async (enabled) => {
    await changeRestEnabled(enabled);
    syncTimerRestEnabled(enabled);
  };

  const handleRestSoundTypeChange = async (type) => {
    await changeRestSoundType(type);
    playSound(type, settings.restVolume);
  };

  const handleRestVolumeChange = async (volume) => {
    await changeRestVolume(volume);
  };

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymrat-notes-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (mode) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (mode === 'replace') {
          const ok = await confirm({
            title: t('profile.importData'),
            message: t('profile.confirmReplace'),
            confirmText: t('common.confirm'),
            cancelText: t('common.cancel'),
          });
          if (!ok) return;
        }

        await importData(data, mode);
        window.location.reload();
      } catch {
        await showAlert({ title: 'Error', message: t('profile.invalidFile'), confirmText: 'OK' });
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="text-sm font-medium block mb-1">{t('profile.name')}</label>
        <input
          type="text"
          value={settings.name}
          onChange={e => handleNameChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm"
        />
      </div>

      {/* Language */}
      <div>
        <label className="text-sm font-medium block mb-1">{t('profile.language')}</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleLanguageChange('es')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${i18n.language === 'es' ? 'bg-primary text-white' : 'bg-surface border border-border'}`}
          >
            Español
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${i18n.language === 'en' ? 'bg-primary text-white' : 'bg-surface border border-border'}`}
          >
            English
          </button>
        </div>
      </div>

      {/* Descanso entre series */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">{t('profile.restTimer')}</label>
          <button
            role="switch"
            aria-checked={settings.restEnabled}
            aria-label={t('profile.restTimer')}
            onClick={async () => { handleRestEnabledChange(!settings.restEnabled); }}
            className={`relative w-11 h-6 rounded-full transition-colors ${settings.restEnabled ? 'bg-primary' : 'bg-border'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.restEnabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        {settings.restEnabled && (
          <>
            <label className="text-sm font-medium block mb-2">{t('profile.timerSound')}</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'none', label: t('profile.soundNone'), icon: '🔕' },
                { key: 'ding', label: 'Ding', icon: '🔔' },
                { key: 'bell', label: t('profile.soundBell'), icon: '🥊' },
                { key: 'beep', label: 'Beep', icon: '📟' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={async () => { handleRestSoundTypeChange(opt.key); }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    settings.restSoundType === opt.key
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            {settings.restSoundType !== 'none' && (
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs text-text-secondary">🔈</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.restVolume}
                  onChange={async (e) => { handleRestVolumeChange(parseFloat(e.target.value)); }}
                  onPointerUp={(e) => {
                    if (settings.restSoundType !== 'none') {
                      playSound(settings.restSoundType, parseFloat(e.currentTarget.value));
                    }
                  }}
                  className="flex-1 h-2 rounded-full appearance-none bg-border accent-primary"
                />
                <span className="text-xs text-text-secondary">🔊</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Data */}
      <div>
        <label className="text-sm font-medium block mb-2">{t('profile.data')}</label>
        <div className="space-y-2">
          <button onClick={handleExport} className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-medium">
            {t('profile.exportData')}
          </button>
          <button onClick={() => handleImport('merge')} className="w-full py-2.5 bg-primary/80 text-white rounded-xl text-sm font-medium">
            {t('profile.importMerge')}
          </button>
          <button onClick={() => handleImport('replace')} className="w-full py-2.5 border border-danger text-danger rounded-xl text-sm font-medium">
            {t('profile.importReplace')}
          </button>
        </div>
      </div>
      <Modal {...modal} />
    </div>
  );
}