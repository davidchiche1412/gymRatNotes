const DANGEROUS_PATTERN = /<\/?script[^>]*>|javascript:|on\w+\s*=/gi;

export function sanitizeString(value, maxLength = 200) {
  if (typeof value !== 'string') return value;
  return value.trim().replace(DANGEROUS_PATTERN, '').slice(0, maxLength);
}

export function sanitizeNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
