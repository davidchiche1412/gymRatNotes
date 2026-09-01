import { db } from '../database';
import { WORKOUT_STATUS } from '../../utils/workoutSync';

export function getWorkouts() {
  return db.workouts.filter(w => !w.deletedAt).toArray();
}

export function getFinishedWorkouts() {
  return db.workouts.where('finishedAt').above(0).filter(w => !w.deletedAt).toArray();
}

export function getFinishedWorkoutsNewestFirst() {
  return db.workouts.where('finishedAt').above(0).filter(w => !w.deletedAt).reverse().toArray();
}

export function getFinishedWorkoutsByRoutine(routineId) {
  return db.workouts
    .where('finishedAt').above(0)
    .filter(w => w.routineId === routineId && !w.deletedAt)
    .reverse()
    .toArray();
}

export function getWorkoutForRoutineSince(routineId, timestamp) {
  return db.workouts
    .where('date')
    .aboveOrEqual(timestamp)
    .filter(workout => workout.routineId === routineId && !workout.deletedAt)
    .first();
}

function withDirty(workout) {
  const now = Date.now();
  return { ...workout, dirty: 1, updatedAt: workout.updatedAt ?? now, createdAt: workout.createdAt ?? now };
}

export function addWorkout(workout) {
  return db.workouts.add(withDirty(workout));
}

export function saveWorkout(workout) {
  return db.workouts.put(withDirty(workout));
}

export async function deleteWorkout(id) {
  const now = Date.now();
  return db.workouts.update(id, { deletedAt: now, dirty: 1, updatedAt: now });
}

export async function replaceWorkout(oldWorkoutId, nextWorkout) {
  await db.transaction('rw', db.workouts, async () => {
    await db.workouts.delete(oldWorkoutId);
    await db.workouts.add(withDirty(nextWorkout));
  });
}

export async function finalizePastWorkouts(beforeTimestamp) {
  return db.transaction('rw', db.workouts, async () => {
    const pending = await db.workouts
      .where('date')
      .below(beforeTimestamp)
      .filter(w => (w.finishedAt == null || w.finishedAt === 0) && !w.deletedAt)
      .toArray();

    if (pending.length === 0) return 0;

    const now = Date.now();
    await db.workouts.bulkPut(
      pending.map(w => withDirty({ ...w, status: WORKOUT_STATUS.FINISHED, finishedAt: w.date, updatedAt: now }))
    );
    return pending.length;
  });
}
