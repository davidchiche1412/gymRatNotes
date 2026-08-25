import { db } from '../database';

export function getExercises() {
  return db.exercises.toArray();
}

export function getExercisesByIds(ids) {
  if (ids.length === 0) return Promise.resolve([]);
  return db.exercises.where('id').anyOf(ids).toArray();
}

export function addExercise(exercise) {
  const now = Date.now();
  return db.exercises.add({ ...exercise, dirty: 1, updatedAt: exercise.updatedAt ?? now, createdAt: exercise.createdAt ?? now });
}
