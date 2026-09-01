import { logError, withTiming } from '../utils/logger';
import { supabase } from './supabase';
import { db } from './database';

// Mapeo tabla local → tabla Supabase
const TABLE_MAP = {
  exercises:       'exercises',
  routines:        'routines',
  weeklySchedule:  'weekly_schedule',
  workouts:        'workouts',
  bodyMeasurements: 'body_measurements',
  userSettings:    'user_settings',
};

// ─── Serializar local → remoto ───────────────────────────────────────────────

function serializeExercise(row, userId) {
  return { id: row.id, user_id: userId, name: row.name, nameEN: row.nameEN, type: row.type, muscleGroup: row.muscleGroup, movementType: row.movementType, isCustom: row.isCustom, updated_at: row.updatedAt ?? Date.now(), created_at: row.createdAt ?? Date.now() };
}

function serializeRoutine(row, userId) {
  return { id: row.id, user_id: userId, name: row.name, exercises: row.exercises, restTime: row.restTime, deletedAt: row.deletedAt ?? null, updated_at: row.updatedAt ?? Date.now(), created_at: row.createdAt ?? Date.now() };
}

function serializeWeeklySchedule(row, userId) {
  return { id: row.id, user_id: userId, dayOfWeek: row.dayOfWeek, routineId: row.routineId, updated_at: row.updatedAt ?? Date.now(), created_at: row.createdAt ?? Date.now() };
}

function serializeWorkout(row, userId) {
  return { id: row.id, user_id: userId, date: row.date, routineId: row.routineId, status: row.status, exercises: row.exercises, prefilledExercises: row.prefilledExercises, finishedAt: row.finishedAt, deletedAt: row.deletedAt ?? null, updated_at: row.updatedAt ?? Date.now(), created_at: row.createdAt ?? Date.now() };
}

function serializeBodyMeasurement(row, userId) {
  const { id, updatedAt, createdAt, dirty, date, ...measurementData } = row;
  return { id, user_id: userId, date, data: measurementData, updated_at: updatedAt ?? Date.now(), created_at: createdAt ?? Date.now() };
}

function serializeUserSettings(row, userId) {
  return { id: row.id, user_id: userId, name: row.name, language: row.language, theme: row.theme, restEnabled: row.restEnabled, restSoundType: row.restSoundType, restVolume: row.restVolume, measurementFields: row.measurementFields, updated_at: row.updatedAt ?? Date.now(), created_at: row.createdAt ?? Date.now() };
}

// ─── Deserializar remoto → local ──────────────────────────────────────────────

function deserializeExercise(row) {
  return { id: row.id, name: row.name, nameEN: row.nameEN, type: row.type, muscleGroup: row.muscleGroup, movementType: row.movementType, isCustom: row.isCustom, updatedAt: row.updated_at, createdAt: row.created_at, dirty: 0 };
}

function deserializeRoutine(row) {
  return { id: row.id, name: row.name, exercises: row.exercises, restTime: row.restTime, deletedAt: row.deletedAt ?? null, updatedAt: row.updated_at, createdAt: row.created_at, dirty: 0 };
}

function deserializeWeeklySchedule(row) {
  return { id: row.id, dayOfWeek: row.dayOfWeek, routineId: row.routineId, updatedAt: row.updated_at, createdAt: row.created_at, dirty: 0 };
}

function deserializeWorkout(row) {
  return { id: row.id, date: row.date, routineId: row.routineId, status: row.status, exercises: row.exercises, prefilledExercises: row.prefilledExercises, finishedAt: row.finishedAt, deletedAt: row.deletedAt ?? null, updatedAt: row.updated_at, createdAt: row.created_at, dirty: 0 };
}

function deserializeBodyMeasurement(row) {
  // Allowlist: solo campos numéricos de medidas, sin keys arbitrarias
  const safeData = {};
  if (row.data && typeof row.data === 'object') {
    for (const [key, val] of Object.entries(row.data)) {
      if (typeof key === 'string' && key !== '__proto__' && key !== 'constructor'
          && key !== 'id' && key !== 'date' && key !== 'dirty'
          && key !== 'updatedAt' && key !== 'createdAt') {
        safeData[key] = typeof val === 'number' ? val : null;
      }
    }
  }
  return { id: row.id, date: row.date, ...safeData, updatedAt: row.updated_at, createdAt: row.created_at, dirty: 0 };
}

function deserializeUserSettings(row) {
  return { id: row.id, name: row.name, language: row.language, theme: row.theme, restEnabled: row.restEnabled, restSoundType: row.restSoundType, restVolume: row.restVolume, measurementFields: row.measurementFields, updatedAt: row.updated_at, createdAt: row.created_at, dirty: 0 };
}

const CONFIGS = [
  { local: 'exercises',        remote: 'exercises',         serialize: serializeExercise,        deserialize: deserializeExercise,        filter: row => row.isCustom },
  { local: 'routines',         remote: 'routines',          serialize: serializeRoutine,         deserialize: deserializeRoutine,         filter: null },
  { local: 'weeklySchedule',   remote: 'weekly_schedule',   serialize: serializeWeeklySchedule,  deserialize: deserializeWeeklySchedule,  filter: null },
  { local: 'workouts',         remote: 'workouts',          serialize: serializeWorkout,         deserialize: deserializeWorkout,         filter: null },
  { local: 'bodyMeasurements', remote: 'body_measurements', serialize: serializeBodyMeasurement, deserialize: deserializeBodyMeasurement, filter: null },
  { local: 'userSettings',     remote: 'user_settings',     serialize: serializeUserSettings,    deserialize: deserializeUserSettings,    filter: null },
];

// ─── Mutex para evitar sync concurrentes ─────────────────────────────────────

let _syncing = false;
let _syncStartedAt = 0;
const SYNC_TIMEOUT_MS = 30_000; // 30s max por sync

// ─── Helpers de meta ──────────────────────────────────────────────────────────

async function getLastSyncAt() {
  const row = await db.syncMeta.get('lastSyncAt');
  return row?.value ?? 0;
}

async function setLastSyncAt(ts) {
  await db.syncMeta.put({ key: 'lastSyncAt', value: ts });
}

// ─── Push: local dirty → Supabase ────────────────────────────────────────────

async function pushTable(config, userId) {
  let rows = await db[config.local].where('dirty').equals(1).toArray();
  if (config.filter) rows = rows.filter(config.filter);
  if (rows.length === 0) return;

  const remote = rows.map(r => config.serialize(r, userId));
  const { error } = await supabase.from(config.remote).upsert(remote, { onConflict: 'id' });
  if (error) throw error;

  await db[config.local].bulkPut(rows.map(r => ({ ...r, dirty: 0 })));
}

// ─── Pull: Supabase cambios desde lastSyncAt → local ──────────────────────────

async function pullTable(config, userId, since) {
  const { data, error } = await supabase
    .from(config.remote)
    .select('*')
    .eq('user_id', userId)
    .gt('updated_at', since);

  if (error) throw error;
  if (!data || data.length === 0) return;

  // Batch: cargar todos los locales de una vez en vez de N queries individuales
  const remoteIds = data.map(r => r.id);
  const locals = await db[config.local].where('id').anyOf(remoteIds).toArray();
  const localMap = Object.fromEntries(locals.map(l => [l.id, l]));

  const toWrite = [];
  for (const remote of data) {
    const localUpdatedAt = localMap[remote.id]?.updatedAt ?? 0;
    if (remote.updated_at > localUpdatedAt) {
      toWrite.push(config.deserialize(remote));
    }
  }
  if (toWrite.length > 0) {
    await db[config.local].bulkPut(toWrite);
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

export async function sync(userId) {
  if (!supabase || !userId) return;
  // Recuperar mutex si lleva más de 30s bloqueado (Supabase colgó)
  if (_syncing && Date.now() - _syncStartedAt < SYNC_TIMEOUT_MS) return;
  _syncing = true;
  _syncStartedAt = Date.now();
  try {
    const since = await getLastSyncAt();
    const now = Date.now();

    await withTiming('sync:push', () => Promise.allSettled(CONFIGS.map(c => pushTable(c, userId))));
    await withTiming('sync:pull', () => Promise.allSettled(CONFIGS.map(c => pullTable(c, userId, since))));

    await setLastSyncAt(now);
  } finally {
    _syncing = false;
  }
}

export async function initialPushAll(userId) {
  if (!supabase || !userId) return;

  for (const config of CONFIGS) {
    try {
      let rows = await db[config.local].toArray();
      if (config.filter) rows = rows.filter(config.filter);
      if (rows.length === 0) continue;

      const remote = rows.map(r => config.serialize(r, userId));
      const { error } = await supabase.from(config.remote).upsert(remote, { onConflict: 'id' });
      if (error) throw error;
      await db[config.local].bulkPut(rows.map(r => ({ ...r, dirty: 0 })));
    } catch (e) {
      logError('sync:push:' + config.remote, e);
    }
  }

  await setLastSyncAt(Date.now());
}

export async function initialPullAll(userId) {
  if (!supabase || !userId) return;

  for (const config of CONFIGS) {
    try {
      const { data, error } = await supabase
        .from(config.remote)
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      if (!data || data.length === 0) continue;

      // Comparar timestamps: no sobreescribir datos locales más recientes
      const remoteIds = data.map(r => r.id);
      const locals = await db[config.local].where('id').anyOf(remoteIds).toArray();
      const localMap = Object.fromEntries(locals.map(l => [l.id, l]));

      const toWrite = [];
      for (const remote of data) {
        const localUpdatedAt = localMap[remote.id]?.updatedAt ?? 0;
        if (remote.updated_at >= localUpdatedAt) {
          toWrite.push(config.deserialize(remote));
        }
      }
      if (toWrite.length > 0) {
        await db[config.local].bulkPut(toWrite);
      }
    } catch (e) {
      logError('sync:pull:' + config.remote, e);
    }
  }

  await setLastSyncAt(Date.now());
}
