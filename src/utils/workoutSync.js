function buildFallbackSet(routineExercise) {
  return {
    weight: routineExercise.targetWeight ?? null,
    reps: routineExercise.targetReps ?? null,
    duration: routineExercise.targetDuration ?? null,
    completed: false,
  };
}

function cloneSetAsPending(set) {
  return {
    weight: set.weight,
    reps: set.reps,
    duration: set.duration,
    completed: false,
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

export function applyAutoFinishedAt(workout) {
  const hasCompleted = workout.exercises.some(ex => ex.sets.some(s => s.completed));
  if (hasCompleted && !workout.finishedAt) return { ...workout, finishedAt: Date.now() };
  if (!hasCompleted && workout.finishedAt) return { ...workout, finishedAt: null };
  return workout;
}
