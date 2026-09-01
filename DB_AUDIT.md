# Auditoría de Persistencia y Base de Datos — GymRat Notes

**Fecha**: 2026-09-01  
**Versión auditada**: `2cedc1b`  
**Bases de datos**: IndexedDB (Dexie v4) local + PostgreSQL (Supabase) remoto

---

## Arquitectura de datos

```
┌─────────────────────┐         ┌─────────────────────┐
│   IndexedDB (Dexie)  │◄──sync──►│  Supabase (Postgres)  │
│   Source of truth     │         │  Backup + multi-device│
│   6 tablas + syncMeta │         │  6 tablas + 2 shared  │
└─────────────────────┘         └─────────────────────┘
```

**Patrón**: offline-first con sync incremental basado en `dirty` flag + `updatedAt` timestamps.

---

## Índices — IndexedDB (Dexie)

### Índices existentes (v2)

| Tabla | Índices |
|-------|---------|
| `exercises` | `id` (PK), `name`, `type`, `muscleGroup`, `movementType`, `isCustom`, `dirty` |
| `routines` | `id` (PK), `name`, `updatedAt`, `dirty` |
| `weeklySchedule` | `id` (PK), `dayOfWeek`, `routineId`, `dirty` |
| `workouts` | `id` (PK), `date`, `routineId`, `finishedAt`, `dirty` |
| `bodyMeasurements` | `id` (PK), `date`, `dirty` |
| `userSettings` | `id` (PK), `dirty` |
| `syncMeta` | `key` (PK) |

### Análisis de uso de índices

| Query | Índice usado | Estado |
|-------|-------------|--------|
| `where('dirty').equals(1)` (push) | ✅ `dirty` | OK |
| `where('finishedAt').above(0)` | ✅ `finishedAt` | OK |
| `where('date').below(ts)` | ✅ `date` | OK |
| `where('date').aboveOrEqual(ts).filter(routineId)` | ⚠️ `date` + JS filter | Aceptable |
| `where('finishedAt').above(0).filter(routineId)` | ⚠️ `finishedAt` + JS filter | Aceptable |
| `where('id').anyOf(ids)` | ✅ PK | OK |
| `where('dayOfWeek').equals(n)` | ✅ `dayOfWeek` | OK |
| `where('routineId').equals(id)` | ✅ `routineId` | OK |
| `orderBy('date').reverse()` | ✅ `date` | OK |
| `orderBy('dayOfWeek')` | ✅ `dayOfWeek` | OK |

### Índices redundantes

| Tabla | Índice | Uso |
|-------|--------|-----|
| `exercises.name` | Solo usado en seed para buscar por nombre. En runtime se usa `id`. | ⚠️ Podría eliminarse en v3 |
| `exercises.type` | No se usa en queries. Se filtra en JS. | ⚠️ Podría eliminarse |
| `exercises.muscleGroup` | No se usa en queries. Se filtra en JS. | ⚠️ Podría eliminarse |
| `exercises.movementType` | No se usa en queries. | ⚠️ Podría eliminarse |
| `routines.name` | No se usa en queries. | ⚠️ Podría eliminarse |
| `routines.updatedAt` | No se usa en queries locales (solo en Supabase). | ⚠️ Podría eliminarse |

**Impacto**: 6 índices innecesarios que no ralentizan reads significativamente pero añaden overhead en cada write. Con el volumen actual (<1000 registros total) el impacto es despreciable. **No corregido** — eliminar índices requiere nueva versión de Dexie que fuerza migración en todos los usuarios.

### Índice que falta

| Query | Índice sugerido | Impacto |
|-------|----------------|---------|
| `where('finishedAt').above(0).filter(routineId)` | Índice compuesto `[routineId+finishedAt]` | Eliminaría el JS filter. Bajo impacto actual (<500 workouts). |

**No implementado** — requiere Dexie v3 migration y el beneficio es marginal con <500 registros.

---

## Índices — Supabase (PostgreSQL)

### Existentes

| Índice | Cubre |
|--------|-------|
| `idx_exercises_sync (user_id, updated_at)` | Pull incremental |
| `idx_routines_sync (user_id, updated_at)` | Pull incremental |
| `idx_weekly_schedule_sync (user_id, updated_at)` | Pull incremental |
| `idx_workouts_sync (user_id, updated_at)` | Pull incremental |
| `idx_body_measurements_sync (user_id, updated_at)` | Pull incremental |
| `idx_user_settings_sync (user_id, updated_at)` | Pull incremental |

**Estado**: ✅ Todos los queries de sync (`WHERE user_id = $1 AND updated_at > $2`) están cubiertos por estos índices compuestos.

### Índices que faltan

Ninguno necesario. Las tablas `shared_routines` y `shared_schedules` se acceden solo por PK.

---

## Queries — Análisis detallado

### Full table scans

| Query | Archivo | Registros esperados | Impacto |
|-------|---------|-------------------|---------|
| `getWorkouts()` → `toArray()` | `useHistoryWorkout.js:11` | 200-500/año | ⚠️ MEDIUM — crece linealmente |
| `getExercises()` → `toArray()` | `ExerciseSelector.jsx:19`, `useStats.js:30` | ~150 (seed) + custom | ✅ LOW — tabla pequeña y estable |
| `getRoutines()` → `toArray()` | `useRoutines.js:12` | 5-15 | ✅ LOW — siempre pequeña |
| `initialPushAll` → `toArray()` por tabla | `sync.js:159` | Una vez por login | ✅ OK — infrecuente |

**Corrección recomendada para `getWorkouts`**: ya documentada en PERFORMANCE_AUDIT.md (PERF-05). Implementar paginación cuando haya >200 workouts reportados.

### Over-fetching (SELECT *)

| Query | Tabla | Campos innecesarios |
|-------|-------|-------------------|
| `pullTable` → `.select('*')` | Todas | Trae `user_id` que no se usa localmente |
| `getFinishedWorkouts()` | workouts | Trae `prefilledExercises` que solo se usa en workout del día |

**Impacto**: Bajo. `prefilledExercises` es el campo más pesado (~200 bytes/ejercicio) pero con 200 workouts son ~40KB extra — tolerable en IndexedDB.

---

## Transacciones

### Estado actual

| Operación | Transaccional | Estado |
|-----------|--------------|--------|
| `deleteRoutineAndClearSchedule` | ✅ `db.transaction('rw', ...)` | OK |
| `replaceWorkout` | ✅ `db.transaction('rw', ...)` | OK |
| `exportAppData` | ✅ `db.transaction('r', ...)` | OK — snapshot consistente |
| `importAppData` | ✅ `db.transaction('rw', ...)` | OK — atómico |
| `finalizePastWorkouts` | ✅ `db.transaction('rw', ...)` | **Corregido en este commit** |
| `clearRoutineFromSchedule` | ✅ `db.transaction('rw', ...)` | **Corregido en este commit** |
| `saveWorkout` (auto-save) | ❌ No transaccional | OK — es un solo `put`, atómico por definición |
| `pushTable` (sync) | ❌ No transaccional | ⚠️ Ver DB-05 |

### DB-05 — `pushTable` read-then-write sin transacción
| Campo | Detalle |
|---|---|
| **Archivo** | `src/db/sync.js:100-110` |
| **Problema** | Lee `dirty: 1`, sube a Supabase, luego escribe `dirty: 0`. Si la app escribe un nuevo cambio entre el read y el write-back, ese cambio se marca como `dirty: 0` sin haber sido subido. |
| **Impacto** | Pérdida silenciosa de cambios en race condition durante sync. Probabilidad baja (ventana <100ms). |
| **Solución** | Envolver read+write en `db.transaction('rw', ...)`. No envolver el upsert de Supabase dentro de la transacción (bloquearía la tabla durante la red). |
| **Trade-off** | Añade complejidad — la ventana de race es muy estrecha. |
| **Estado** | Documentado, no corregido. Corregir cuando se reporte pérdida de datos. |

---

## Race conditions

### Corregidas

| # | Problema | Fix |
|---|---------|-----|
| **DB-01** | `finalizePastWorkouts` read-then-write sin lock | Envuelto en `db.transaction('rw', ...)` |
| **DB-02** | `sync()` concurrente desde interval + online + login | Mutex `_syncing` con try/finally |
| **DB-03** | `clearRoutineFromSchedule` read-then-update sin lock | Envuelto en `db.transaction('rw', ...)` |
| **DB-04** | `writeQueue` cadena rota si un write falla | `.catch(() => {})` mantiene la cadena |

### Documentadas (no corregidas)

| # | Problema | Riesgo |
|---|---------|--------|
| **DB-05** | `pushTable` read dirty → network → write clean sin lock | Bajo — ventana <100ms |
| **DB-06** | Dos tabs abiertas pueden crear dos workouts para hoy | Bajo — UX improbable |

---

## Soft deletes

### Estado actual: NO implementado

| Operación | Implementación | Problema |
|-----------|---------------|---------|
| `deleteWorkout(id)` | `db.workouts.delete(id)` — hard delete | El registro vuelve del remoto en el siguiente pull |
| `deleteMeasurementById(id)` | `db.bodyMeasurements.delete(id)` — hard delete | Ídem |
| `deleteRoutineAndClearSchedule(id)` | `db.routines.delete(id)` — hard delete | Ídem |

**Impacto**: Cualquier registro borrado reaparece tras sync con Supabase.

**Solución recomendada**: Añadir campo `deletedAt` (bigint, null por defecto). El delete marca `deletedAt = Date.now()` + `dirty: 1`. Sync sube el cambio. Pull respeta `deletedAt`. Queries filtran `deletedAt == null`. Requiere Dexie v3 + cambio en todas las queries de lectura.

**Estado**: Documentado en AUDIT.md como P0. Implementar antes de que sync esté en producción.

---

## Integridad referencial

### Local (IndexedDB)

IndexedDB/Dexie **no soporta foreign keys**. Las relaciones son:

| Relación | Integridad |
|----------|-----------|
| `workout.routineId → routines.id` | ❌ No validada — si se borra una rutina, los workouts quedan huérfanos |
| `weeklySchedule.routineId → routines.id` | ✅ `deleteRoutineAndClearSchedule` limpia la referencia |
| `workout.exercises[].exerciseId → exercises.id` | ❌ No validada — si se borra un ejercicio, los workouts mantienen la referencia |

**Impacto**: Los registros huérfanos no causan crashes (se manejan con `?.` y fallbacks) pero pueden mostrar "..." en vez del nombre del ejercicio.

### Remoto (Supabase)

| FK | Estado |
|----|--------|
| `*.user_id → auth.users(id) ON DELETE CASCADE` | ✅ Configurado en todas las tablas |
| `routineId` cross-table | ❌ No hay FK — son text IDs sin constraint |

**Impacto**: Bajo — RLS ya garantiza que cada usuario solo ve sus datos.

---

## Constraints y validación

### Faltantes

| Campo | Tabla | Constraint recomendado | Estado |
|-------|-------|----------------------|--------|
| `workouts.status` | workouts | `CHECK (status IN ('not_started','draft','in_progress','finished'))` | ❌ Sin constraint |
| `weeklySchedule.dayOfWeek` | weekly_schedule | `CHECK (dayOfWeek >= 0 AND dayOfWeek <= 6)` | ❌ Sin constraint |
| `routines.restTime` | routines | `CHECK (restTime >= 0 AND restTime <= 600)` | ❌ Sin constraint |
| `exercises.type` | exercises | `CHECK (type IN ('weight','bodyweight','timed'))` | ❌ Sin constraint |

**Estado**: Documentado. Los constraints son recomendables en Supabase (PostgreSQL) pero no críticos dado que la app valida en el frontend.

---

## Migraciones

### IndexedDB (Dexie)

| Versión | Cambios | Estado |
|---------|---------|--------|
| v1 | Schema inicial | ✅ |
| v2 | + índice `dirty` en todas las tablas, + tabla `syncMeta` | ✅ |

**Riesgo**: Si se necesita una v3 (ej: para soft deletes o quitar índices), Dexie maneja la migración automáticamente al detectar versión nueva. Pero si la migración falla (ej: usuario cierra el tab), la BD puede quedar en estado inconsistente.

### Supabase

Archivo único `supabase/schema.sql` con `IF NOT EXISTS` — idempotente y re-ejecutable.

---

## Caché

### Estado actual: SIN caché explícito

| Dato | Frecuencia de lectura | Caché | Recomendación |
|------|--------------------|-------|---------------|
| `getSettings()` | Cada mount de useSettings | ❌ | Cachear en memoria del hook — ya lo hace el estado de React |
| `getExercises()` | Cada mount de ExerciseSelector y useStats | ❌ | OK — tabla pequeña (~150 rows) |
| `getRoutines()` | Cada mount de useRoutines | ❌ | OK — tabla pequeña (~5-15 rows) |

**Conclusión**: React ya actúa como caché vía estado del componente. No se necesita caché adicional con el volumen actual.

---

## Resumen de correcciones aplicadas

| # | Problema | Fix | Archivo |
|---|---------|-----|---------|
| DB-01 | `finalizePastWorkouts` sin transacción | `db.transaction('rw', ...)` | `workouts.js` |
| DB-02 | `sync()` sin mutex | Flag `_syncing` con try/finally | `sync.js` |
| DB-03 | `clearRoutineFromSchedule` sin transacción | `db.transaction('rw', ...)` | `weeklySchedule.js` |
| DB-04 | `writeQueue` cadena rota si falla | `.catch(() => {})` | `useTodayWorkout.js` |

**91 tests pasando, build OK.**
