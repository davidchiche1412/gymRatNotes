import Dexie from 'dexie';

export const db = new Dexie('GymRatNotesDB');

db.version(1).stores({
  exercises: 'id, name, type, muscleGroup, movementType, isCustom',
  routines: 'id, name, updatedAt',
  weeklySchedule: 'id, dayOfWeek, routineId',
  workouts: 'id, date, routineId, finishedAt',
  bodyMeasurements: 'id, date',
  userSettings: 'id',
});

// v2: añade índice dirty para sync y tabla de meta de sync
db.version(2).stores({
  exercises: 'id, name, type, muscleGroup, movementType, isCustom, dirty',
  routines: 'id, name, updatedAt, dirty',
  weeklySchedule: 'id, dayOfWeek, routineId, dirty',
  workouts: 'id, date, routineId, finishedAt, dirty',
  bodyMeasurements: 'id, date, dirty',
  userSettings: 'id, dirty',
  syncMeta: 'key',
});
