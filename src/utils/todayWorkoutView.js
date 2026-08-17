export function buildTodayWorkout({ routine, workout, exerciseInfoMap = {}, dayOfWeek }) {
  if (!routine || !workout) return null;

  return {
    id: workout.id,
    date: workout.date,
    routineId: routine.id,
    routineName: routine.name,
    restTime: routine.restTime,
    dayOfWeek,
    status: workout.status,
    finishedAt: workout.finishedAt,
    exercises: workout.exercises.map((workoutExercise) => {
      const routineExercise = routine.exercises.find(ex => ex.exerciseId === workoutExercise.exerciseId);
      const exerciseInfo = exerciseInfoMap[workoutExercise.exerciseId] || {};
      const prefilledExercise = workout.prefilledExercises?.find(ex => ex.exerciseId === workoutExercise.exerciseId);

      return {
        exerciseId: workoutExercise.exerciseId,
        name: exerciseInfo.name,
        nameEN: exerciseInfo.nameEN,
        type: exerciseInfo.type,
        muscleGroup: exerciseInfo.muscleGroup,
        movementType: exerciseInfo.movementType,
        notes: workoutExercise.notes,
        targetSets: routineExercise?.targetSets,
        targetWeight: routineExercise?.targetWeight,
        targetReps: routineExercise?.targetReps,
        targetDuration: routineExercise?.targetDuration,
        sets: workoutExercise.sets,
        prefilledSets: prefilledExercise?.sets || [],
      };
    }),
  };
}

export function getTodayWorkoutProgress(todayWorkout) {
  const totalSets = todayWorkout?.exercises?.reduce((sum, ex) => sum + ex.sets.length, 0) || 0;
  const completedSets = todayWorkout?.exercises?.reduce(
    (sum, ex) => sum + ex.sets.filter(set => set.completed).length,
    0
  ) || 0;

  return {
    totalSets,
    completedSets,
    progress: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
  };
}

export function getWorkoutSetInputValue(workoutStatus, set, field) {
  if (workoutStatus === 'not_started' && !set.completed) return '';
  return set[field] ?? '';
}

export function getWorkoutSetPlaceholder(prefilledSets, setIndex, field) {
  return prefilledSets?.[setIndex]?.[field] ?? '—';
}
