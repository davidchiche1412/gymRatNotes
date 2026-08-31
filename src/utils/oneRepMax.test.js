import test from 'node:test';
import assert from 'node:assert/strict';
import { epley, brzycki, lombardi, calculateOneRepMax, findBestSetForExercise } from './oneRepMax.js';

test('epley(100, 5) returns approximately 116.67', () => {
  const result = epley(100, 5);
  assert.ok(Math.abs(result - 116.67) < 0.01);
});

test('brzycki(100, 5) returns approximately 112.5', () => {
  const result = brzycki(100, 5);
  assert.ok(Math.abs(result - 112.5) < 0.01);
});

test('lombardi(100, 5) returns approximately 117.46', () => {
  const result = lombardi(100, 5);
  assert.ok(Math.abs(result - 117.46) < 0.01);
});

test('calculateOneRepMax with reps=1 returns weight for all formulas', () => {
  const result = calculateOneRepMax(80, 1);
  assert.deepEqual(result, { epley: 80, brzycki: 80, lombardi: 80 });
});

test('calculateOneRepMax returns null for invalid inputs', () => {
  assert.equal(calculateOneRepMax(100, 0), null);
  assert.equal(calculateOneRepMax(100, -1), null);
  assert.equal(calculateOneRepMax(100, 31), null);
  assert.equal(calculateOneRepMax(0, 5), null);
});

test('calculateOneRepMax(100, 5) returns rounded results', () => {
  const result = calculateOneRepMax(100, 5);
  assert.equal(result.epley, 116.7);
  assert.equal(result.brzycki, 112.5);
  assert.equal(result.lombardi, 117.5);
});

test('findBestSetForExercise finds set with highest volume', () => {
  const workouts = [
    {
      exercises: [
        {
          exerciseId: 'ex1',
          sets: [
            { weight: 80, reps: 10 },
            { weight: 100, reps: 5 },
          ],
        },
      ],
    },
    {
      exercises: [
        {
          exerciseId: 'ex1',
          sets: [
            { weight: 90, reps: 10 },
          ],
        },
      ],
    },
  ];
  const best = findBestSetForExercise(workouts, 'ex1');
  assert.equal(best.weight, 90);
  assert.equal(best.reps, 10);
  assert.equal(best.volume, 900);
});

test('findBestSetForExercise returns null if no matching exercise', () => {
  const workouts = [
    { exercises: [{ exerciseId: 'ex1', sets: [{ weight: 100, reps: 5 }] }] },
  ];
  assert.equal(findBestSetForExercise(workouts, 'ex999'), null);
});

test('findBestSetForExercise ignores sets without weight or reps', () => {
  const workouts = [
    {
      exercises: [
        {
          exerciseId: 'ex1',
          sets: [
            { weight: null, reps: 10 },
            { weight: 80, reps: null },
            { weight: 60, reps: 0 },
            { weight: 50, reps: 8 },
          ],
        },
      ],
    },
  ];
  const best = findBestSetForExercise(workouts, 'ex1');
  assert.equal(best.weight, 50);
  assert.equal(best.reps, 8);
});
