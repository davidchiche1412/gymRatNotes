import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMaxWeightData,
  buildPersonalRecords,
  filterRecordsByMuscleGroup,
  getExerciseIdsWithWeightData,
  getMuscleGroupsWithRecords,
} from './stats.js';

const workouts = [
  {
    date: Date.UTC(2026, 0, 2),
    exercises: [
      { exerciseId: 'bench', sets: [{ weight: 80, reps: 8 }, { weight: 85, reps: 5 }] },
      { exerciseId: 'pullup', sets: [{ reps: 8 }] },
    ],
  },
  {
    date: Date.UTC(2026, 0, 5),
    exercises: [
      { exerciseId: 'bench', sets: [{ weight: 90, reps: 3 }] },
      { exerciseId: 'squat', sets: [{ weight: 100, reps: 5 }] },
    ],
  },
];

const exercises = [
  { id: 'bench', name: 'Bench', muscleGroup: 'chest' },
  { id: 'squat', name: 'Squat', muscleGroup: 'legs' },
  { id: 'pullup', name: 'Pull-up', muscleGroup: 'back' },
];

test('getExerciseIdsWithWeightData only returns exercises with weight entries', () => {
  assert.deepEqual([...getExerciseIdsWithWeightData(workouts)].sort(), ['bench', 'squat']);
});

test('buildMaxWeightData shows the max weight per workout date', () => {
  assert.deepEqual(buildMaxWeightData(workouts, 'bench', 'en').map(point => point.weight), [85, 90]);
});

test('buildPersonalRecords ranks the best volume set per exercise', () => {
  const records = buildPersonalRecords(workouts, exercises);

  assert.equal(records[0].exercise.id, 'bench');
  assert.equal(records[0].volume, 640);
  assert.equal(records[1].exercise.id, 'squat');
  assert.equal(records[1].volume, 500);
});

test('records can be filtered by muscle group', () => {
  const records = buildPersonalRecords(workouts, exercises);

  assert.deepEqual(getMuscleGroupsWithRecords(records), ['chest', 'legs']);
  assert.deepEqual(filterRecordsByMuscleGroup(records, 'chest').map(record => record.exercise.id), ['bench']);
  assert.equal(filterRecordsByMuscleGroup(records, '').length, 2);
});
