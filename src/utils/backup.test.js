import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAppBackup } from './backup.js';

test('validateAppBackup accepts valid exported app data', () => {
  const backup = validateAppBackup({
    version: 1,
    exercises: [{ id: 'ex-1' }],
    routines: [],
    weeklySchedule: [],
    workouts: [],
    bodyMeasurements: [],
    userSettings: [],
  });

  assert.deepEqual(backup.exercises, [{ id: 'ex-1' }]);
  assert.deepEqual(backup.routines, []);
});

test('validateAppBackup fills missing tables as empty arrays', () => {
  const backup = validateAppBackup({ version: 1, exercises: [] });

  assert.deepEqual(backup.workouts, []);
  assert.deepEqual(backup.userSettings, []);
});

test('validateAppBackup rejects invalid backup shape', () => {
  assert.throws(() => validateAppBackup(null), /object/);
  assert.throws(() => validateAppBackup({ version: '1' }), /version/);
  assert.throws(() => validateAppBackup({ workouts: {} }), /workouts/);
});

test('validateAppBackup rejects array input', () => {
  assert.throws(() => validateAppBackup([]), { message: /must be an object/ });
});

test('validateAppBackup rejects null input', () => {
  assert.throws(() => validateAppBackup(null), { message: /must be an object/ });
});

test('validateAppBackup rejects table that is not an array', () => {
  assert.throws(() => validateAppBackup({ exercises: 'bad' }), { message: /must be an array/ });
});

test('validateAppBackup preserves valid rows as-is', () => {
  const data = { exercises: [{ id: 'a', name: 'test' }] };
  const result = validateAppBackup(data);
  assert.equal(result.exercises[0].id, 'a');
  assert.equal(result.exercises[0].name, 'test');
  // Missing tables should be empty arrays
  assert.deepEqual(result.routines, []);
});
