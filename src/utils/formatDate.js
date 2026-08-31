export function getLocale(language) {
  return language === 'es' ? 'es-ES' : 'en-US';
}

export function formatDate(timestamp, language, options = {}) {
  const defaults = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(timestamp).toLocaleDateString(getLocale(language), { ...defaults, ...options });
}
