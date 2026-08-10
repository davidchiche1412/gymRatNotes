import { db } from '../database';

export function getWorkouts() {
  return db.workouts.toArray();
}

export function getFinishedWorkouts() {
  return db.workouts.where('finishedAt').above(0).toArray();
}

export function getFinishedWorkoutsNewestFirst() {
  return db.workouts.where('finishedAt').above(0).reverse().toArray();
}

export function getWorkoutForRoutineSince(routineId, timestamp) {
  return db.workouts
    .where('date')
    .aboveOrEqual(timestamp)
    .filter(workout => workout.routineId === routineId)
    .first();
}

export function addWorkout(workout) {
  return db.workouts.add(workout);
}

export function saveWorkout(workout) {
  return db.workouts.put(workout);
}

export function deleteWorkout(id) {
  return db.workouts.delete(id);
}
