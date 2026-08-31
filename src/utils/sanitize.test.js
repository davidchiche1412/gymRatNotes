import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeString, sanitizeNumber } from './sanitize.js';

test('sanitizeString trims and caps length', () => {
  assert.equal(sanitizeString('  hello  '), 'hello');
  assert.equal(sanitizeString('a'.repeat(300), 100), 'a'.repeat(100));
});

test('sanitizeString strips script tags and event handlers', () => {
  assert.equal(sanitizeString('<script>alert(1)</script>'), 'alert(1)');
  assert.equal(sanitizeString('hello<script src="x.js">'), 'hello');
  assert.equal(sanitizeString('img onerror=alert(1)'), 'img alert(1)');
  assert.equal(sanitizeString('javascript:void(0)'), 'void(0)');
});

test('sanitizeString passes through non-strings unchanged', () => {
  assert.equal(sanitizeString(null), null);
  assert.equal(sanitizeString(42), 42);
});

test('sanitizeNumber returns finite numbers or null', () => {
  assert.equal(sanitizeNumber(42), 42);
  assert.equal(sanitizeNumber('80.5'), 80.5);
  assert.equal(sanitizeNumber(''), null);
  assert.equal(sanitizeNumber(null), null);
  assert.equal(sanitizeNumber(Infinity), null);
  assert.equal(sanitizeNumber(NaN), null);
  assert.equal(sanitizeNumber('not a number'), null);
});
