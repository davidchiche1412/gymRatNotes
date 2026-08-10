import { db } from '../database';

export function getSettings() {
  return db.userSettings.get('settings');
}

export function saveSettings(settings) {
  return db.userSettings.put(settings);
}

export async function exportAppData() {
  return {
    exercises: await db.exercises.toArray(),
    routines: await db.routines.toArray(),
    weeklySchedule: await db.weeklySchedule.toArray(),
    workouts: await db.workouts.toArray(),
    bodyMeasurements: await db.bodyMeasurements.toArray(),
    userSettings: await db.userSettings.toArray(),
    exportedAt: Date.now(),
    version: 1,
  };
}

export async function importAppData(data, mode) {
  if (mode === 'replace') {
    await db.exercises.clear();
    await db.routines.clear();
    await db.weeklySchedule.clear();
    await db.workouts.clear();
    await db.bodyMeasurements.clear();
    await db.userSettings.clear();
  }

  if (data.exercises) await db.exercises.bulkPut(data.exercises);
  if (data.routines) await db.routines.bulkPut(data.routines);
  if (data.weeklySchedule) await db.weeklySchedule.bulkPut(data.weeklySchedule);
  if (data.workouts) await db.workouts.bulkPut(data.workouts);
  if (data.bodyMeasurements) await db.bodyMeasurements.bulkPut(data.bodyMeasurements);
  if (data.userSettings) await db.userSettings.bulkPut(data.userSettings);
}
