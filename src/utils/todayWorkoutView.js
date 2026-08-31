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
        targetWeightMode: routineExercise?.targetWeightMode || 'total',
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
  // Muestra el valor solo si el usuario lo ha introducido explícitamente o la sesión está avanzada
  if (set.completed || set.userEdited) return set[field] ?? '';
  if (workoutStatus === 'in_progress' || workoutStatus === 'finished') return set[field] ?? '';
  return '';
}

export function getWorkoutSetPlaceholder(prefilledSets, sets, setIndex, field) {
  // Solo propaga valores de series que el usuario ha editado o completado
  for (let i = setIndex - 1; i >= 0; i--) {
    const s = sets?.[i];
    if (!s || (!s.completed && !s.userEdited)) continue;
    const val = s[field];
    if (val != null && val !== '') return val;
  }
  return prefilledSets?.[setIndex]?.[field] ?? '—';
}

export function getWorkoutSetSuggestions(prefilledSets, sets, setIndex, field) {
  if (!field) return [];
  const seen = new Set();
  const suggestions = [];

  // Solo cuenta como "introducido por el usuario" si la serie fue editada o completada
  for (let i = setIndex - 1; i >= 0; i--) {
    const s = sets?.[i];
    if (!s || (!s.completed && !s.userEdited)) continue;
    const val = s[field];
    if (val != null && val !== '') {
      if (!seen.has(val)) { seen.add(val); suggestions.push(val); }
      break;
    }
  }

  // Valor histórico prefilled para esta serie
  const historical = prefilledSets?.[setIndex]?.[field];
  if (historical != null && historical !== '' && !seen.has(historical)) {
    seen.add(historical);
    suggestions.push(historical);
  }

  return suggestions;
}
