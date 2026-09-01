export function sanitizeString(value, maxLength = 200) {
  if (typeof value !== 'string') return value;
  // Elimina TODOS los tags HTML — allowlist approach
  return value.replace(/<[^>]*>/g, '').trim().slice(0, maxLength);
}

export function sanitizeNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
