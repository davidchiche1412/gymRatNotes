import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeSettings } from './settings.js';

test('mergeSettings preserves current settings and applies patch', () => {
  const before = Date.now();
  const settings = mergeSettings(
    { id: 'settings', name: 'David', language: 'en', restVolume: 0.7 },
    { restVolume: 0.4 }
  );

  assert.equal(settings.id, 'settings');
  assert.equal(settings.name, 'David');
  assert.equal(settings.language, 'en');
  assert.equal(settings.restVolume, 0.4);
  assert.equal(typeof settings.updatedAt, 'number');
  assert.ok(settings.updatedAt >= before);
});

test('mergeSettings forces canonical id after patch', () => {
  const settings = mergeSettings(null, { id: 'bad-id', language: 'es' });

  assert.equal(settings.id, 'settings');
  assert.equal(settings.language, 'es');
});
