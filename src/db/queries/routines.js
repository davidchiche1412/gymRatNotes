import { db } from '../database';

export function getRoutines() {
  return db.routines.toArray();
}

export function getRoutine(id) {
  return db.routines.get(id);
}

export function addRoutine(routine) {
  const now = Date.now();
  return db.routines.add({ ...routine, dirty: 1, createdAt: routine.createdAt ?? now });
}

export function updateRoutine(id, patch) {
  return db.routines.update(id, { ...patch, dirty: 1 });
}

export function deleteRoutineById(id) {
  return db.routines.delete(id);
}

export async function deleteRoutineAndClearSchedule(id) {
  await db.transaction('rw', db.routines, db.weeklySchedule, async () => {
    await db.routines.delete(id);
    const schedules = await db.weeklySchedule.where('routineId').equals(id).toArray();
    for (const schedule of schedules) {
      await db.weeklySchedule.update(schedule.id, { routineId: null, dirty: 1, updatedAt: Date.now() });
    }
  });
}
