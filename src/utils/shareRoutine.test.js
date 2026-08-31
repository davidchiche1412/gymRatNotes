import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeRoutineForSharing } from './shareRoutine.js';

test('serializeRoutineForSharing includes only sharing-relevant fields', () => {
  const routine = {
    id: 'abc-123',
    name: 'Push Day',
    exercises: [
      { exerciseId: 'ex1', targetSets: 3, targetWeight: 60, targetReps: 10, targetDuration: null, targetWeightMode: 'total' },
    ],
    restTime: 90,
    updatedAt: 1700000000000,
    createdAt: 1699000000000,
    dirty: 1,
  };

  const result = serializeRoutineForSharing(routine);

  assert.deepStrictEqual(Object.keys(result).sort(), ['exercises', 'name', 'restTime']);
  assert.equal(result.name, 'Push Day');
  assert.equal(result.restTime, 90);
  assert.equal(result.exercises.length, 1);
  assert.equal(result.exercises[0].exerciseId, 'ex1');
});

test('serializeRoutineForSharing excludes id, updatedAt, createdAt, dirty', () => {
  const routine = {
    id: 'xyz',
    name: 'Leg Day',
    exercises: [],
    restTime: 60,
    updatedAt: 123,
    createdAt: 456,
    dirty: 0,
  };

  const result = serializeRoutineForSharing(routine);

  assert.equal(result.id, undefined);
  assert.equal(result.updatedAt, undefined);
  assert.equal(result.createdAt, undefined);
  assert.equal(result.dirty, undefined);
});
