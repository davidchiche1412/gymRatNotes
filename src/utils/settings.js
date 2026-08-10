const browserLanguage = typeof navigator === 'undefined' ? 'en' : navigator.language;

export const DEFAULT_SETTINGS = {
  id: 'settings',
  name: '',
  theme: 'system',
  language: browserLanguage.startsWith('es') ? 'es' : 'en',
  restEnabled: true,
  restSoundType: 'ding',
  restVolume: 0.7,
};

export function mergeSettings(current, patch = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...current,
    ...patch,
    id: 'settings',
    updatedAt: Date.now(),
  };
}
