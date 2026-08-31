export function serializeRoutineForSharing(routine) {
  return {
    name: routine.name,
    exercises: routine.exercises,
    restTime: routine.restTime,
  };
}
