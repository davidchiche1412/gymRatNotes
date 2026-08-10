const BACKUP_TABLES = [
  'exercises',
  'routines',
  'weeklySchedule',
  'workouts',
  'bodyMeasurements',
  'userSettings',
];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateAppBackup(data) {
  if (!isPlainObject(data)) {
    throw new TypeError('Backup must be an object');
  }

  if (data.version !== undefined && typeof data.version !== 'number') {
    throw new TypeError('Backup version must be a number');
  }

  const backup = {};
  for (const table of BACKUP_TABLES) {
    const rows = data[table];
    if (rows === undefined) {
      backup[table] = [];
      continue;
    }
    if (!Array.isArray(rows)) {
      throw new TypeError(`${table} must be an array`);
    }
    backup[table] = rows;
  }

  return backup;
}
