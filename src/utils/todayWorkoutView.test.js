import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTodayWorkout,
  getTodayWorkoutProgress,
  getWorkoutSetInputValue,
  getWorkoutSetPlaceholder,
} from './todayWorkoutView.js';

test('buildTodayWorkout joins routine, workout and exercise info for the UI', () => {
  const todayWorkout = buildTodayWorkout({
    dayOfWeek: 0,
    routine: {
      id: 'routine-a',
      name: 'Día A',
      restTime: 90,
      exercises: [{ exerciseId: 'bench', targetSets: 2, targetWeight: 80, targetReps: 8 }],
    },
    workout: {
      id: 'workout-1',
      date: 123,
      status: 'in_progress',
      finishedAt: null,
      exercises: [{
        exerciseId: 'bench',
        notes: null,
        sets: [{ weight: 82.5, reps: 8, duration: null, completed: true }],
      }],
      prefilledExercises: [{
        exerciseId: 'bench',
        sets: [{ weight: 80, reps: 8, duration: null }],
      }],
    },
    exerciseInfoMap: {
      bench: {
        name: 'Press de banca',
        nameEN: 'Bench Press',
        type: 'weight',
        muscleGroup: 'chest',
        movementType: 'push',
      },
    },
  });

  assert.equal(todayWorkout.routineName, 'Día A');
  assert.equal(todayWorkout.dayOfWeek, 0);
  assert.equal(todayWorkout.exercises[0].name, 'Press de banca');
  assert.equal(todayWorkout.exercises[0].targetWeight, 80);
  assert.equal(todayWorkout.exercises[0].targetWeightMode, 'total');
  assert.deepEqual(todayWorkout.exercises[0].prefilledSets, [{ weight: 80, reps: 8, duration: null }]);
});

test('getTodayWorkoutProgress returns totals and percentage', () => {
  const progress = getTodayWorkoutProgress({
    exercises: [
      { sets: [{ completed: true }, { completed: false }] },
      { sets: [{ completed: true }] },
    ],
  });

  assert.deepEqual(progress, {
    totalSets: 3,
    completedSets: 2,
    progress: 67,
  });
});

test('workout set inputs use prefilled data as placeholders before starting', () => {
  const set = { weight: 80, reps: 8, completed: false };
  const prefilledSets = [{ weight: 80, reps: 8 }];

  assert.equal(getWorkoutSetInputValue('not_started', set, 'weight'), '');
  assert.equal(getWorkoutSetPlaceholder(prefilledSets, 0, 'weight'), 80);
  assert.equal(getWorkoutSetInputValue('in_progress', set, 'weight'), 80);
});
