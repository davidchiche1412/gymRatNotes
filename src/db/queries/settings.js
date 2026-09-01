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

function sanitizeRow(row) {
  if (!row || typeof row !== 'object' || !row.id) return null;
  const clean = {};
  for (const [key, val] of Object.entries(row)) {
    if (key === '__proto__' || key === 'constructor') continue;
    if (typeof val === 'string') {
      clean[key] = val.replace(/<[^>]*>/g, '').slice(0, 500);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

export async function importAppData(data, mode) {
  const backup = validateAppBackup(data);

  // Sanitizar cada row: strip HTML tags, validar id presente
  const sanitized = {};
  for (const table of Object.keys(backup)) {
    sanitized[table] = backup[table].map(sanitizeRow).filter(Boolean);
  }

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

      await db.exercises.bulkPut(sanitized.exercises);
      await db.routines.bulkPut(sanitized.routines);
      await db.weeklySchedule.bulkPut(sanitized.weeklySchedule);
      await db.workouts.bulkPut(sanitized.workouts);
      await db.bodyMeasurements.bulkPut(sanitized.bodyMeasurements);
      await db.userSettings.bulkPut(sanitized.userSettings);
    }
  );
}
