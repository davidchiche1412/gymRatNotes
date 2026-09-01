import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeString, sanitizeNumber } from './sanitize.js';

test('sanitizeString trims and caps length', () => {
  assert.equal(sanitizeString('  hello  '), 'hello');
  assert.equal(sanitizeString('a'.repeat(300), 100), 'a'.repeat(100));
});

test('sanitizeString strips all HTML tags', () => {
  assert.equal(sanitizeString('<script>alert(1)</script>'), 'alert(1)');
  assert.equal(sanitizeString('hello<script src="x.js">world'), 'helloworld');
  assert.equal(sanitizeString('<img onerror=alert(1)>'), '');
  assert.equal(sanitizeString('<svg onload=alert(1)>'), '');
  assert.equal(sanitizeString('<iframe src="evil.com">'), '');
  assert.equal(sanitizeString('<b>bold</b>'), 'bold');
  assert.equal(sanitizeString('normal text'), 'normal text');
});

test('sanitizeString handles nested tags', () => {
  assert.equal(sanitizeString('<scr<script>ipt>alert(1)</script>'), 'ipt>alert(1)');
});

test('sanitizeString passes through non-strings unchanged', () => {
  assert.equal(sanitizeString(null), null);
  assert.equal(sanitizeString(42), 42);
  assert.equal(sanitizeString(undefined), undefined);
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
