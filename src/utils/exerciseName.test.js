import test from 'node:test';
import assert from 'node:assert/strict';
import { getExerciseName, getExerciseNameById } from './exerciseName.js';

test('getExerciseName returns localized exercise name', () => {
  const exercise = { name: 'Press de banca', nameEN: 'Bench Press' };

  assert.equal(getExerciseName(exercise, 'es'), 'Press de banca');
  assert.equal(getExerciseName(exercise, 'en'), 'Bench Press');
});

test('getExerciseName falls back to default name and missing exercise fallback', () => {
  assert.equal(getExerciseName({ name: 'Dominadas' }, 'en'), 'Dominadas');
  assert.equal(getExerciseName(null, 'es', '...'), '...');
  assert.equal(getExerciseNameById({}, 'missing', 'es'), '...');
});
