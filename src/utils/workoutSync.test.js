import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSetsFromRoutineExercise,
  createWorkoutFromRoutine,
  createWorkoutExercisesFromRoutine,
  createPrefilledExercises,
  deriveWorkoutStatus,
  finalizeWorkout,
  finishAllWorkoutSets,
  getWorkoutStatus,
  hasCompletedSets,
  hasManualChanges,
  shouldShowWorkoutInHistory,
  syncPrefilledExercises,
  syncWorkoutExercises,
  syncWorkoutWithRoutine,
  toggleWorkoutSetCompleted,
  WORKOUT_STATUS,
  applyUserChangeStatus,
  updateWorkoutSetValue,
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

test('createWorkoutFromRoutine creates not_started workout with prefilled baseline', () => {
  const workout = createWorkoutFromRoutine({
    id: 'routine-a',
    exercises: [{ exerciseId: 'bench', targetSets: 1, targetWeight: 80, targetReps: 8 }],
  }, {}, 'workout-1', 123);

  assert.equal(workout.id, 'workout-1');
  assert.equal(workout.date, 123);
  assert.equal(workout.routineId, 'routine-a');
  assert.equal(workout.status, WORKOUT_STATUS.NOT_STARTED);
  assert.deepEqual(workout.prefilledExercises, [{
    exerciseId: 'bench',
    sets: [{ weight: 80, reps: 8, duration: null }],
  }]);
});

test('syncWorkoutWithRoutine syncs exercises and preserves existing status', () => {
  const synced = syncWorkoutWithRoutine(
    { exercises: [
      { exerciseId: 'bench', targetSets: 2 },
      { exerciseId: 'row', targetSets: 1, targetWeight: 50 },
    ] },
    {
      status: WORKOUT_STATUS.IN_PROGRESS,
      exercises: [{ exerciseId: 'bench', sets: [{ weight: 80, reps: 8, duration: null, completed: true }] }],
      prefilledExercises: [{ exerciseId: 'bench', sets: [{ weight: 80, reps: 8, duration: null }] }],
    },
    {}
  );

  assert.equal(synced.status, WORKOUT_STATUS.IN_PROGRESS);
  assert.deepEqual(synced.exercises.map(ex => ex.exerciseId), ['bench', 'row']);
  assert.equal(synced.exercises[0].sets.length, 2);
});

test('updateWorkoutSetValue stores numeric values and uncompletes the set', () => {
  const updated = updateWorkoutSetValue({
    exercises: [{ sets: [{ weight: 80, reps: 8, duration: null, completed: true }] }],
  }, 0, 0, 'weight', '82.5');

  assert.deepEqual(updated.exercises[0].sets[0], {
    weight: 82.5,
    reps: 8,
    duration: null,
    completed: false,
    userEdited: true,
  });
});

test('toggleWorkoutSetCompleted toggles only the requested set', () => {
  const updated = toggleWorkoutSetCompleted({
    exercises: [{ sets: [{ completed: false }, { completed: true }] }],
  }, 0, 0);

  assert.deepEqual(updated.exercises[0].sets.map(set => set.completed), [true, true]);
});

test('toggleWorkoutSetCompleted fills missing values from placeholders when completing', () => {
  const updated = toggleWorkoutSetCompleted({
    exercises: [{
      exerciseId: 'bench',
      sets: [
        { weight: 90, reps: 8, duration: null, completed: true },
        { weight: null, reps: null, duration: null, completed: false },
      ],
    }],
    prefilledExercises: [{
      exerciseId: 'bench',
      sets: [
        { weight: 80, reps: 8, duration: null },
        { weight: 80, reps: 10, duration: null },
      ],
    }],
  }, 0, 1);

  assert.deepEqual(updated.exercises[0].sets[1], {
    weight: 90,
    reps: 8,
    duration: null,
    completed: true,
    userEdited: true,
  });
});

test('toggleWorkoutSetCompleted uses historical prefilled values for first set', () => {
  const updated = toggleWorkoutSetCompleted({
    exercises: [{
      exerciseId: 'bench',
      sets: [
        { weight: null, reps: null, duration: null, completed: false },
      ],
    }],
    prefilledExercises: [{
      exerciseId: 'bench',
      sets: [
        { weight: 80, reps: 10, duration: null },
      ],
    }],
  }, 0, 0);

  assert.deepEqual(updated.exercises[0].sets[0], {
    weight: 80,
    reps: 10,
    duration: null,
    completed: true,
    userEdited: true,
  });
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

test('hasCompletedSets returns true when any set is completed', () => {
  assert.equal(hasCompletedSets({
    exercises: [{ sets: [{ completed: false }, { completed: true }] }],
  }), true);
});

test('hasCompletedSets returns false when no sets are completed', () => {
  assert.equal(hasCompletedSets({
    exercises: [{ sets: [{ completed: false }] }],
  }), false);
  assert.equal(hasCompletedSets({
    exercises: [],
  }), false);
});

test('getWorkoutStatus uses explicit status when present', () => {
  assert.equal(getWorkoutStatus({ status: 'finished' }), 'finished');
  assert.equal(getWorkoutStatus({ status: 'in_progress' }), 'in_progress');
});

test('getWorkoutStatus falls back to finishedAt when no status', () => {
  assert.equal(getWorkoutStatus({
    status: undefined,
    finishedAt: 123,
    exercises: [{ sets: [{ completed: false, weight: null, reps: null, duration: null }] }],
  }), WORKOUT_STATUS.FINISHED);
});

test('getWorkoutStatus derives from exercises when no status or finishedAt', () => {
  assert.equal(getWorkoutStatus({
    status: undefined,
    finishedAt: null,
    exercises: [{ sets: [{ completed: false, weight: null, reps: null, duration: null }] }],
  }), WORKOUT_STATUS.NOT_STARTED);
});

test('createWorkoutExercisesFromRoutine maps exercises with previous data', () => {
  const result = createWorkoutExercisesFromRoutine(
    [
      { exerciseId: 'bench', targetSets: 2, targetWeight: 80, targetReps: 8 },
      { exerciseId: 'row', targetSets: 1, targetWeight: 50, targetReps: 10 },
    ],
    { bench: { sets: [{ weight: 85, reps: 6, duration: null, completed: true }] } }
  );

  assert.equal(result.length, 2);
  assert.equal(result[0].exerciseId, 'bench');
  assert.equal(result[0].sets[0].weight, 85); // from previous data
  assert.equal(result[0].sets.length, 2);
  assert.equal(result[1].exerciseId, 'row');
  assert.equal(result[1].sets[0].weight, 50); // from routine target
  assert.equal(result[1].notes, null);
});

test('createPrefilledExercises clones set data without completed flag', () => {
  const prefilled = createPrefilledExercises([
    { exerciseId: 'bench', sets: [{ weight: 80, reps: 8, duration: null, completed: true }] },
  ]);

  assert.equal(prefilled[0].exerciseId, 'bench');
  assert.deepEqual(prefilled[0].sets[0], { weight: 80, reps: 8, duration: null });
  assert.equal(prefilled[0].sets[0].completed, undefined);
});

test('syncPrefilledExercises syncs and clones prefilled baseline', () => {
  const result = syncPrefilledExercises(
    [{ exerciseId: 'bench', targetSets: 1 }],
    [{ exerciseId: 'bench', sets: [{ weight: 80, reps: 8, duration: null }] }],
    {}
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].exerciseId, 'bench');
  assert.deepEqual(result[0].sets[0], { weight: 80, reps: 8, duration: null });
});
