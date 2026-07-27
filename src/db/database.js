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
