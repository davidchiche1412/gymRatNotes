import { resolveWorkoutSetFallbackValue } from './todayWorkoutView.js';

function buildFallbackSet(routineExercise) {
  return {
    weight: routineExercise.targetWeight ?? null,
    reps: routineExercise.targetReps ?? null,
    duration: routineExercise.targetDuration ?? null,
    completed: false,
  };
}

export const WORKOUT_STATUS = {
  NOT_STARTED: 'not_started',
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished',
};

function cloneSetAsPending(set) {
  return {
    weight: set.weight,
    reps: set.reps,
    duration: set.duration,
    completed: false,
  };
}

function cloneSetData(set) {
  return {
    weight: set.weight ?? null,
    reps: set.reps ?? null,
    duration: set.duration ?? null,
  };
}

export function createSetsFromRoutineExercise(routineExercise, previousExercise) {
  const targetSets = routineExercise.targetSets || 3;

  if (previousExercise?.sets?.length > 0) {
    const sets = previousExercise.sets.slice(0, targetSets).map(cloneSetAsPending);
    while (sets.length < targetSets) {
      const last = sets[sets.length - 1];
      sets.push({ ...last, completed: false });
    }
    return sets;
  }

  return Array.from({ length: targetSets }, () => buildFallbackSet(routineExercise));
}

export function createWorkoutExercisesFromRoutine(routineExercises, previousDataMap = {}) {
  return routineExercises.map(ex => ({
    exerciseId: ex.exerciseId,
    notes: null,
    sets: createSetsFromRoutineExercise(ex, previousDataMap[ex.exerciseId]),
  }));
}

export function createPrefilledExercises(exercises) {
  return exercises.map(ex => ({
    exerciseId: ex.exerciseId,
    sets: ex.sets.map(cloneSetData),
  }));
}

export function createWorkoutFromRoutine(routine, previousDataMap, id, date) {
  const exercises = createWorkoutExercisesFromRoutine(routine.exercises, previousDataMap);

  return {
    id,
    date,
    routineId: routine.id,
    status: WORKOUT_STATUS.NOT_STARTED,
    exercises,
    prefilledExercises: createPrefilledExercises(exercises),
    finishedAt: null,
  };
}

export function syncWorkoutExercises(routineExercises, workoutExercises = [], previousDataMap = {}) {
  return routineExercises.map((routineExercise) => {
    const existing = workoutExercises.find(ex => ex.exerciseId === routineExercise.exerciseId);
    const targetSets = routineExercise.targetSets || 3;

    if (!existing) {
      return {
        exerciseId: routineExercise.exerciseId,
        notes: null,
        sets: createSetsFromRoutineExercise(routineExercise, previousDataMap[routineExercise.exerciseId]),
      };
    }

    const sets = existing.sets.slice(0, targetSets);
    while (sets.length < targetSets) {
      const fallback = sets[sets.length - 1] || buildFallbackSet(routineExercise);
      sets.push({ ...fallback, completed: false });
    }

    return {
      ...existing,
      sets,
    };
  });
}

export function syncPrefilledExercises(routineExercises, workoutExercises = [], previousDataMap = {}) {
  return createPrefilledExercises(syncWorkoutExercises(routineExercises, workoutExercises, previousDataMap));
}

export function syncWorkoutWithRoutine(routine, workout, previousDataMap = {}) {
  const synced = {
    ...workout,
    exercises: syncWorkoutExercises(routine.exercises, workout.exercises, previousDataMap),
    prefilledExercises: syncPrefilledExercises(
      routine.exercises,
      workout.prefilledExercises || workout.exercises,
      previousDataMap
    ),
  };

  return {
    ...synced,
    status: synced.status || getWorkoutStatus(synced),
  };
}

export function hasCompletedSets(workout) {
  return workout.exercises.some(ex => ex.sets.some(s => s.completed));
}

export function hasManualChanges(workout) {
  if (!workout.prefilledExercises) {
    return workout.exercises.some(ex => ex.sets.some(s =>
      s.weight != null || s.reps != null || s.duration != null
    ));
  }

  return workout.exercises.some(ex => {
    const prefilledExercise = workout.prefilledExercises.find(prefill => prefill.exerciseId === ex.exerciseId);
    return ex.sets.some((set, index) => {
      const prefilledSet = prefilledExercise?.sets?.[index] || {};
      return set.weight !== (prefilledSet.weight ?? null)
        || set.reps !== (prefilledSet.reps ?? null)
        || set.duration !== (prefilledSet.duration ?? null);
    });
  });
}

export function deriveWorkoutStatus(workout) {
  if (workout.status === WORKOUT_STATUS.FINISHED) return WORKOUT_STATUS.FINISHED;
  if (hasCompletedSets(workout)) return WORKOUT_STATUS.IN_PROGRESS;
  if (hasManualChanges(workout)) return WORKOUT_STATUS.DRAFT;
  return WORKOUT_STATUS.NOT_STARTED;
}

export function getWorkoutStatus(workout) {
  if (workout.status) return workout.status;
  if (workout.finishedAt > 0) return WORKOUT_STATUS.FINISHED;
  return deriveWorkoutStatus(workout);
}

export function applyUserChangeStatus(workout, previousStatus = workout.status) {
  if (previousStatus === WORKOUT_STATUS.FINISHED) {
    return { ...workout, status: WORKOUT_STATUS.IN_PROGRESS, finishedAt: null };
  }
  return { ...workout, status: deriveWorkoutStatus(workout), finishedAt: null };
}

export function updateWorkoutSetValue(workout, exIdx, setIdx, field, value) {
  const exercises = [...workout.exercises];
  const sets = [...exercises[exIdx].sets];
  sets[setIdx] = {
    ...sets[setIdx],
    [field]: value === '' ? null : Number(value),
    completed: false,
    userEdited: true,
  };
  exercises[exIdx] = { ...exercises[exIdx], sets };

  return { ...workout, exercises };
}

export function toggleWorkoutSetCompleted(workout, exIdx, setIdx) {
  const exercises = [...workout.exercises];
  const sets = [...exercises[exIdx].sets];
  const nextCompleted = !sets[setIdx].completed;
  const prefilledSets = workout.prefilledExercises?.find(
    ex => ex.exerciseId === exercises[exIdx].exerciseId
  )?.sets || [];
  const nextSet = { ...sets[setIdx], completed: nextCompleted };

  if (nextCompleted) {
    ['weight', 'reps', 'duration'].forEach(field => {
      if (nextSet[field] != null) return;

      const fallbackValue = resolveWorkoutSetFallbackValue(prefilledSets, sets, setIdx, field);
      if (fallbackValue != null) nextSet[field] = fallbackValue;
    });
    nextSet.userEdited = true;
  }

  sets[setIdx] = nextSet;
  exercises[exIdx] = { ...exercises[exIdx], sets };

  return { ...workout, exercises };
}

export function shouldShowWorkoutInHistory(workout) {
  return getWorkoutStatus(workout) !== WORKOUT_STATUS.NOT_STARTED;
}

export function finalizeWorkout(workout) {
  return { ...workout, status: WORKOUT_STATUS.FINISHED, finishedAt: Date.now() };
}

export function finishAllWorkoutSets(workout) {
  const exercises = workout.exercises.map(ex => ({
    ...ex,
    sets: ex.sets.map(set => ({ ...set, completed: true })),
  }));
  return finalizeWorkout({ ...workout, exercises });
}
