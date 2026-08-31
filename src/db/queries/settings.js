import { sanitizeString } from '../../utils/sanitize';
import { db } from '../database';
import { validateAppBackup } from '../../utils/backup';

export function getSettings() {
  return db.userSettings.get('settings');
}

export function saveSettings(settings) {
  const sanitized = settings.name ? { ...settings, name: sanitizeString(settings.name, 50) } : settings;
  return db.userSettings.put(sanitized);
}

export async function exportAppData() {
  return db.transaction(
    'r',
    db.exercises,
    db.routines,
    db.weeklySchedule,
    db.workouts,
    db.bodyMeasurements,
    db.userSettings,
    async () => ({
      exercises: await db.exercises.toArray(),
      routines: await db.routines.toArray(),
      weeklySchedule: await db.weeklySchedule.toArray(),
      workouts: await db.workouts.toArray(),
      bodyMeasurements: await db.bodyMeasurements.toArray(),
      userSettings: await db.userSettings.toArray(),
      exportedAt: Date.now(),
      version: 1,
    })
  );
}

export async function importAppData(data, mode) {
  const backup = validateAppBackup(data);

  await db.transaction(
    'rw',
    db.exercises,
    db.routines,
    db.weeklySchedule,
    db.workouts,
    db.bodyMeasurements,
    db.userSettings,
    async () => {
      if (mode === 'replace') {
        await db.exercises.clear();
        await db.routines.clear();
        await db.weeklySchedule.clear();
        await db.workouts.clear();
        await db.bodyMeasurements.clear();
        await db.userSettings.clear();
      }

      await db.exercises.bulkPut(backup.exercises);
      await db.routines.bulkPut(backup.routines);
      await db.weeklySchedule.bulkPut(backup.weeklySchedule);
      await db.workouts.bulkPut(backup.workouts);
      await db.bodyMeasurements.bulkPut(backup.bodyMeasurements);
      await db.userSettings.bulkPut(backup.userSettings);
    }
  );
}
