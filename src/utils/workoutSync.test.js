import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSetsFromRoutineExercise,
  createPrefilledExercises,
  deriveWorkoutStatus,
  finalizeWorkout,
  finishAllWorkoutSets,
  getWorkoutStatus,
  hasManualChanges,
  shouldShowWorkoutInHistory,
  syncWorkoutExercises,
  WORKOUT_STATUS,
  applyUserChangeStatus,
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

test('hasManualChanges detects typed values when there is no prefill baseline', () => {
  assert.equal(hasManualChanges({
    exercises: [{ sets: [{ weight: 80, reps: null, duration: null, completed: false }] }],
  }), true);
  assert.equal(hasManualChanges({
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

test('deriveWorkoutStatus keeps prefilled workouts hidden until user interaction', () => {
  const workout = {
    exercises: [{ exerciseId: 'bench', sets: [{ weight: 80, reps: 8, duration: null, completed: false }] }],
  };
  workout.prefilledExercises = createPrefilledExercises(workout.exercises);

  assert.equal(deriveWorkoutStatus(workout), WORKOUT_STATUS.NOT_STARTED);
  assert.equal(shouldShowWorkoutInHistory({ ...workout, status: deriveWorkoutStatus(workout) }), false);
});

test('deriveWorkoutStatus moves from draft to in_progress by completed sets', () => {
  const workout = {
    exercises: [{ exerciseId: 'bench', sets: [{ weight: 85, reps: 8, duration: null, completed: false }] }],
    prefilledExercises: [{ exerciseId: 'bench', sets: [{ weight: 80, reps: 8, duration: null }] }],
  };

  assert.equal(deriveWorkoutStatus(workout), WORKOUT_STATUS.DRAFT);
  assert.equal(deriveWorkoutStatus({
    ...workout,
    exercises: [{ exerciseId: 'bench', sets: [{ weight: 85, reps: 8, duration: null, completed: true }] }],
  }), WORKOUT_STATUS.IN_PROGRESS);
});

test('finished workouts are disabled until edited and history can finish all sets', () => {
  const finished = finalizeWorkout({ exercises: [{ sets: [{ completed: false }] }], finishedAt: null });
  const allFinished = finishAllWorkoutSets({
    exercises: [{ sets: [{ completed: false }, { completed: false }] }],
    finishedAt: null,
  });

  assert.equal(getWorkoutStatus(finished), WORKOUT_STATUS.FINISHED);
  assert.deepEqual(allFinished.exercises[0].sets.map(s => s.completed), [true, true]);
  assert.equal(getWorkoutStatus(allFinished), WORKOUT_STATUS.FINISHED);
});

test('applyUserChangeStatus moves finished workouts back to in_progress', () => {
  const updated = applyUserChangeStatus({
    status: WORKOUT_STATUS.FINISHED,
    finishedAt: 123,
    exercises: [{ sets: [{ completed: false, weight: 90, reps: 8, duration: null }] }],
    prefilledExercises: [{ sets: [{ weight: 80, reps: 8, duration: null }] }],
  }, WORKOUT_STATUS.FINISHED);

  assert.equal(updated.status, WORKOUT_STATUS.IN_PROGRESS);
  assert.equal(updated.finishedAt, null);
});
