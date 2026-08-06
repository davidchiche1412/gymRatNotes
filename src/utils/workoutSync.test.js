import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAutoFinishedAt,
  createSetsFromRoutineExercise,
  finalizeWorkout,
  hasWorkoutProgress,
  shouldShowWorkoutInHistory,
  syncWorkoutExercises,
} from './workoutSync.js';

test('createSetsFromRoutineExercise uses routine targets when there is no previous data', () => {
  const sets = createSetsFromRoutineExercise({
    exerciseId: 'squat',
    targetSets: 2,
    targetWeight: 80,
    targetReps: 8,
  });

  assert.deepEqual(sets, [
    { weight: 80, reps: 8, duration: null, completed: false },
    { weight: 80, reps: 8, duration: null, completed: false },
  ]);
});

test('syncWorkoutExercises removes deleted exercises and adds new routine exercises', () => {
  const synced = syncWorkoutExercises(
    [
      { exerciseId: 'hip-thrust', targetSets: 3, targetWeight: 50, targetReps: 10 },
      { exerciseId: 'curl-femoral', targetSets: 2, targetWeight: 30, targetReps: 12 },
    ],
    [
      { exerciseId: 'deleted-exercise', sets: [{ weight: 1, reps: 1, completed: true }] },
      { exerciseId: 'hip-thrust', notes: 'keep', sets: [{ weight: 60, reps: 8, completed: true }] },
    ],
    {
      'curl-femoral': { sets: [{ weight: 25, reps: 12, duration: null, completed: true }] },
    }
  );

  assert.deepEqual(synced.map(ex => ex.exerciseId), ['hip-thrust', 'curl-femoral']);
  assert.equal(synced[0].notes, 'keep');
  assert.equal(synced[0].sets.length, 3);
  assert.equal(synced[0].sets[0].completed, true);
  assert.equal(synced[0].sets[1].completed, false);
  assert.equal(synced[1].sets.length, 2);
  assert.equal(synced[1].sets[0].weight, 25);
  assert.equal(synced[1].sets[0].completed, false);
});

test('syncWorkoutExercises trims sets when the routine target sets decrease', () => {
  const synced = syncWorkoutExercises(
    [{ exerciseId: 'bench', targetSets: 1 }],
    [{ exerciseId: 'bench', sets: [
      { weight: 70, reps: 10, completed: true },
      { weight: 75, reps: 8, completed: false },
    ] }],
  );

  assert.equal(synced[0].sets.length, 1);
  assert.deepEqual(synced[0].sets[0], { weight: 70, reps: 10, completed: true });
});

test('applyAutoFinishedAt reflects whether any set is completed', () => {
  const finished = applyAutoFinishedAt({
    exercises: [{ sets: [{ completed: true }] }],
    finishedAt: null,
  });
  const alreadySaved = applyAutoFinishedAt({
    exercises: [{ sets: [{ completed: false }] }],
    finishedAt: 123,
  });

  assert.equal(typeof finished.finishedAt, 'number');
  assert.equal(alreadySaved.finishedAt, 123);
});

test('hasWorkoutProgress detects typed values even without completed sets', () => {
  assert.equal(hasWorkoutProgress({
    exercises: [{ sets: [{ weight: 80, reps: null, duration: null, completed: false }] }],
  }), true);
  assert.equal(hasWorkoutProgress({
    exercises: [{ sets: [{ weight: null, reps: null, duration: null, completed: false }] }],
  }), false);
});

test('finalizeWorkout always marks the workout as finished now', () => {
  const saved = finalizeWorkout({ exercises: [], finishedAt: null });
  assert.equal(typeof saved.finishedAt, 'number');
});

test('shouldShowWorkoutInHistory includes drafts with progress', () => {
  assert.equal(shouldShowWorkoutInHistory({
    finishedAt: null,
    exercises: [{ sets: [{ weight: 50, reps: 10, duration: null, completed: false }] }],
  }), true);
  assert.equal(shouldShowWorkoutInHistory({
    finishedAt: null,
    exercises: [{ sets: [{ weight: null, reps: null, duration: null, completed: false }] }],
  }), false);
  assert.equal(shouldShowWorkoutInHistory({
    finishedAt: 123,
    exercises: [{ sets: [{ weight: null, reps: null, duration: null, completed: false }] }],
  }), true);
});
