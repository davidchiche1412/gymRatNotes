import test from 'node:test';
import assert from 'node:assert/strict';
import { getLocale, formatDate } from './formatDate.js';

test('getLocale returns es-ES for Spanish and en-US for other', () => {
  assert.equal(getLocale('es'), 'es-ES');
  assert.equal(getLocale('en'), 'en-US');
  assert.equal(getLocale('fr'), 'en-US');
});

test('formatDate returns a formatted date string', () => {
  const ts = Date.UTC(2026, 0, 15);
  const result = formatDate(ts, 'en');
  assert.ok(result.includes('15'));
  assert.ok(result.includes('Jan'));
});
