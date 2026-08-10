import { db } from '../database';

export function getRoutines() {
  return db.routines.toArray();
}

export function getRoutine(id) {
  return db.routines.get(id);
}

export function addRoutine(routine) {
  return db.routines.add(routine);
}

export function updateRoutine(id, patch) {
  return db.routines.update(id, patch);
}

export function deleteRoutineById(id) {
  return db.routines.delete(id);
}

export async function deleteRoutineAndClearSchedule(id) {
  await db.transaction('rw', db.routines, db.weeklySchedule, async () => {
    await db.routines.delete(id);
    const schedules = await db.weeklySchedule.where('routineId').equals(id).toArray();
    for (const schedule of schedules) {
      await db.weeklySchedule.update(schedule.id, { routineId: null });
    }
  });
}
