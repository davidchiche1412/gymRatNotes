export function getExerciseName(exercise, language, fallback = '') {
  if (!exercise) return fallback;
  return language === 'en' && exercise.nameEN ? exercise.nameEN : exercise.name;
}

export function getExerciseNameById(exerciseMap, exerciseId, language, fallback = '...') {
  return getExerciseName(exerciseMap[exerciseId], language, fallback);
}
