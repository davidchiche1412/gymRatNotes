import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeRoutineForSharing, encodeSchedule, decodeSchedule, validateImportedRoutine, validateImportedSchedule } from './shareRoutine.js';

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

test('encodeSchedule and decodeSchedule roundtrip', () => {
  const data = [{ day: 0, routine: { name: 'A', exercises: [], restTime: 60 } }];
  const encoded = encodeSchedule(data);
  assert.ok(encoded.startsWith('plan-'));
  assert.deepEqual(decodeSchedule(encoded), data);
});

test('decodeSchedule returns null for invalid input', () => {
  assert.equal(decodeSchedule('not-a-plan'), null);
  assert.equal(decodeSchedule('plan-!!!invalid!!!'), null);
});

test('validateImportedRoutine rejects invalid data', () => {
  assert.equal(validateImportedRoutine(null), null);
  assert.equal(validateImportedRoutine({ name: '', exercises: [] }), null);
  assert.equal(validateImportedRoutine({ name: 'A', exercises: 'bad' }), null);
});

test('validateImportedRoutine sanitizes valid data', () => {
  const result = validateImportedRoutine({
    name: '  Push Day  ',
    exercises: [
      { exerciseId: 'bench', targetSets: 100, targetWeight: 80, targetReps: 10, targetWeightMode: 'invalid' },
      { exerciseId: null }, // filtrado
    ],
    restTime: 9999,
    extraField: 'ignored',
  });

  assert.equal(result.name, 'Push Day');
  assert.equal(result.exercises.length, 1);
  assert.equal(result.exercises[0].targetSets, 20); // capped
  assert.equal(result.exercises[0].targetWeightMode, 'total'); // sanitized
  assert.equal(result.restTime, 600); // capped
  assert.equal(result.extraField, undefined);
});

test('validateImportedSchedule rejects non-array', () => {
  assert.equal(validateImportedSchedule('bad'), null);
  assert.equal(validateImportedSchedule([]), null);
});

test('validateImportedSchedule filters invalid entries', () => {
  const result = validateImportedSchedule([
    { day: 0, routine: { name: 'A', exercises: [], restTime: 60 } },
    { day: 99, routine: null }, // day out of range
    { day: 1, routine: null },
  ]);

  assert.equal(result.length, 2);
  assert.equal(result[0].day, 0);
  assert.equal(result[0].routine.name, 'A');
  assert.equal(result[1].day, 1);
  assert.equal(result[1].routine, null);
});

test('encodeSchedule handles empty schedule', () => {
  const encoded = encodeSchedule([]);
  assert.ok(encoded.startsWith('plan-'));
  assert.deepEqual(decodeSchedule(encoded), []);
});

test('validateImportedRoutine caps extreme values', () => {
  const result = validateImportedRoutine({
    name: 'Test',
    exercises: [{ exerciseId: 'x', targetSets: -5, targetWeight: -100, targetReps: 0 }],
    restTime: -10,
  });
  assert.equal(result.exercises[0].targetSets, 1); // min 1
  assert.equal(result.restTime, 0); // min 0
});

test('validateImportedRoutine filters exercises without exerciseId string', () => {
  const result = validateImportedRoutine({
    name: 'Test',
    exercises: [
      { exerciseId: 123 },        // number, not string
      { exerciseId: '' },          // empty string — still a string
      { targetSets: 3 },           // no exerciseId
      { exerciseId: 'valid', targetSets: 3 },
    ],
    restTime: 60,
  });
  // Solo pasan exerciseId que sean strings (incluido '' que es truthy para typeof)
  assert.equal(result.exercises.length, 2); // '' y 'valid'
});
