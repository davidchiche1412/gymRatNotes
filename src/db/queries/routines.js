import { sanitizeString } from '../../utils/sanitize';
import { db } from '../database';

export function getRoutines() {
  return db.routines.filter(r => !r.deletedAt).toArray();
}

export function getRoutine(id) {
  return db.routines.get(id);
}

export function addRoutine(routine) {
  const now = Date.now();
  return db.routines.add({ ...routine, name: sanitizeString(routine.name, 100), dirty: 1, createdAt: routine.createdAt ?? now });
}

export function updateRoutine(id, patch) {
  const sanitized = patch.name ? { ...patch, name: sanitizeString(patch.name, 100) } : patch;
  return db.routines.update(id, { ...sanitized, dirty: 1 });
}

export async function deleteRoutineById(id) {
  const now = Date.now();
  return db.routines.update(id, { deletedAt: now, dirty: 1, updatedAt: now });
}

export async function deleteRoutineAndClearSchedule(id) {
  await db.transaction('rw', db.routines, db.weeklySchedule, async () => {
    await db.routines.update(id, { deletedAt: Date.now(), dirty: 1, updatedAt: Date.now() });
    const schedules = await db.weeklySchedule.where('routineId').equals(id).toArray();
    for (const schedule of schedules) {
      await db.weeklySchedule.update(schedule.id, { routineId: null, dirty: 1, updatedAt: Date.now() });
    }
  });
}
