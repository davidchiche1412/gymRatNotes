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
