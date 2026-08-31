import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFrequencyData,
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

test('buildFrequencyData groups workouts by week and returns last 12', () => {
  const w = [
    { date: Date.UTC(2026, 0, 5), exercises: [] },  // lun semana 1
    { date: Date.UTC(2026, 0, 7), exercises: [] },  // mie semana 1
    { date: Date.UTC(2026, 0, 12), exercises: [] }, // lun semana 2
  ];
  const freq = buildFrequencyData(w, 'en');

  assert.equal(freq.length, 2);
  assert.equal(freq[0].count, 2); // semana 1: 2 workouts
  assert.equal(freq[1].count, 1); // semana 2: 1 workout
});

test('buildFrequencyData limits output to 12 weeks', () => {
  // 15 semanas con 1 workout cada una
  const w = Array.from({ length: 15 }, (_, i) => ({
    date: Date.UTC(2026, 0, 5 + i * 7),
    exercises: [],
  }));
  const freq = buildFrequencyData(w, 'en');

  assert.equal(freq.length, 12);
});

test('getMuscleGroupsWithRecords returns sorted unique groups', () => {
  const records = [
    { exercise: { muscleGroup: 'legs' } },
    { exercise: { muscleGroup: 'chest' } },
    { exercise: { muscleGroup: 'legs' } },
    { exercise: { muscleGroup: null } },
  ];
  assert.deepEqual(getMuscleGroupsWithRecords(records), ['chest', 'legs']);
});

test('getMuscleGroupsWithRecords returns empty for no records', () => {
  assert.deepEqual(getMuscleGroupsWithRecords([]), []);
});
