export function serializeRoutineForSharing(routine) {
  return {
    name: routine.name,
    exercises: routine.exercises,
    restTime: routine.restTime,
  };
}

export function encodeSchedule(scheduleData) {
  const json = JSON.stringify(scheduleData);
  return 'plan-' + btoa(unescape(encodeURIComponent(json)));
}

export function decodeSchedule(planId) {
  if (!planId.startsWith('plan-')) return null;
  try {
    const json = decodeURIComponent(escape(atob(planId.slice(5))));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function validateImportedRoutine(data) {
  if (!data || typeof data !== 'object') return null;
  if (typeof data.name !== 'string' || !data.name.trim()) return null;
  if (!Array.isArray(data.exercises)) return null;

  return {
    name: data.name.trim().slice(0, 100),
    exercises: data.exercises.filter(ex =>
      ex && typeof ex.exerciseId === 'string'
    ).map(ex => ({
      exerciseId: ex.exerciseId,
      targetSets: Math.max(1, Math.min(Number(ex.targetSets) || 3, 20)),
      targetWeight: ex.targetWeight != null ? Number(ex.targetWeight) || null : null,
      targetReps: ex.targetReps != null ? Number(ex.targetReps) || null : null,
      targetDuration: ex.targetDuration != null ? Number(ex.targetDuration) || null : null,
      targetWeightMode: ['total', 'per_side', 'machine'].includes(ex.targetWeightMode) ? ex.targetWeightMode : 'total',
    })),
    restTime: Math.max(0, Math.min(Number(data.restTime) || 60, 600)),
  };
}

export function validateImportedSchedule(data) {
  if (!Array.isArray(data)) return null;

  const validated = data
    .filter(entry => entry && typeof entry.day === 'number' && entry.day >= 0 && entry.day <= 6)
    .map(entry => ({
      day: entry.day,
      routine: entry.routine ? validateImportedRoutine(entry.routine) : null,
    }));

  return validated.length > 0 ? validated : null;
}
