import { db } from '../database';

export function getWeeklySchedule() {
  return db.weeklySchedule.orderBy('dayOfWeek').toArray();
}

export function getScheduleForDay(dayOfWeek) {
  return db.weeklySchedule.where('dayOfWeek').equals(dayOfWeek).first();
}

export function updateScheduleRoutine(id, routineId) {
  return db.weeklySchedule.update(id, { routineId, dirty: 1, updatedAt: Date.now() });
}

export async function clearRoutineFromSchedule(routineId) {
  const schedules = await db.weeklySchedule.where('routineId').equals(routineId).toArray();
  for (const schedule of schedules) {
    await updateScheduleRoutine(schedule.id, null);
  }
}
