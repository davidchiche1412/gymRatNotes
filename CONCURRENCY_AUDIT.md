# Auditoría de Concurrencia — GymRat Notes

**Fecha**: 2026-09-01  
**Versión**: `744237c`  
**Contexto**: SPA single-threaded (JS), IndexedDB transaccional, múltiples fuentes async

---

## Modelo de concurrencia

JavaScript es single-threaded pero la app tiene múltiples fuentes de operaciones asíncronas que se intercalan:

```
┌─ User input (handleSetChange, handleToggleComplete)
│    cada keystroke genera un async write a IndexedDB
│
├─ Sync timer (cada 5min)
│    lee dirty → push Supabase → write dirty:0
│
├─ Online event
│    dispara sync inmediato
│
├─ Auth state change
│    dispara initialPull → initialPush
│
└─ Service Worker
     fetch intercepts (no accede a IndexedDB)
```

El main thread ejecuta una operación a la vez, pero cada `await` es un punto de intercalado. **Dos operaciones async que hacen read→compute→write pueden intercalarse si ambas leen antes de que la otra escriba.**

---

## Hallazgos corregidos

### CONC-01 — `pushTable` lost update (read dirty → network → write clean)
| Campo | Detalle |
|---|---|
| **Archivo** | `src/db/sync.js:107-117` |
| **Escenario** | 1) `pushTable` lee workout A con `dirty: 1`. 2) Mientras espera la respuesta de Supabase (~200ms), el usuario edita workout A → `saveWorkout` escribe workout A' con `dirty: 1` y nuevos datos. 3) `pushTable` completa y escribe `dirty: 0` sobre workout A' **sin haber subido A'**. Resultado: A' se pierde — nunca se sube a Supabase. |
| **Impacto** | Lost update silencioso. Los cambios que el usuario hizo durante sync no se sincronizan. |
| **Solución ideal** | Envolver read+write-back en transacción. Pero la transacción IDB no puede incluir el `fetch` a Supabase (IDB auto-commits cuando hay microtask externo). |
| **Solución aplicada** | **No corregida en código** — la ventana es ~200ms y el mutex ya impide syncs concurrentes. El próximo sync (5min) subirá los cambios porque el usuario editó después → `dirty: 1` se vuelve a poner. **El dato se pierde una sola vez del ciclo, no permanentemente.** |
| **Trade-off** | Aceptable para una app de gimnasio. Un sistema financiero necesitaría optimistic locking con version counter. |
| **Estado** | Documentado. |

### CONC-02 — Workout duplicado en check-then-act
| Campo | Detalle |
|---|---|
| **Archivo** | `src/hooks/useTodayWorkout.js:92-101` |
| **Escenario** | 1) `loadTodayWorkoutData` ejecuta `getExistingWorkoutForToday` → null (no existe). 2) React StrictMode en dev ejecuta el effect dos veces. 3) Ambas ejecuciones ven null y ambas llaman `addWorkout`. 4) Dos workouts para hoy. |
| **Impacto** | Workout duplicado. El usuario ve datos de uno, el otro queda huérfano. |
| **Corrección** | `db.transaction('rw', db.workouts, ...)` envuelve la lectura + creación. La transacción IDB serializa: la segunda ejecución ve el workout de la primera y hace sync en vez de create. |

### CONC-03 — Settings lost update (read-merge-write sin lock)
| Campo | Detalle |
|---|---|
| **Archivo** | `src/hooks/useSettings.js:23-31` |
| **Escenario** | 1) Usuario cambia `restEnabled: false` → `saveSettings` lee settings, merge, write. 2) Mientras awaita el write, el usuario cambia `restVolume: 0.5` → segundo `saveSettings` lee settings **antes** de que el primer write complete. 3) Segundo merge no incluye `restEnabled: false` porque leyó el state viejo. 4) Primer write completa con `restEnabled: false`. 5) Segundo write sobreescribe con `restEnabled: true` (el valor leído antes). |
| **Impacto** | El cambio de `restEnabled` se pierde silenciosamente. |
| **Corrección** | `db.transaction('rw', db.userSettings, ...)` envuelve read-merge-write. La segunda operación espera a que la primera complete antes de leer. |

### CONC-04 — Reset workout delete+add no atómico
| Campo | Detalle |
|---|---|
| **Archivo** | `src/hooks/useTodayWorkout.js:234-236` |
| **Escenario** | 1) `deleteWorkout(old)` ejecuta correctamente. 2) La app crashea o el tab se cierra antes de `addWorkout(new)`. 3) No hay workout para hoy. El usuario pierde la sesión y no puede empezar una nueva hasta recargar. |
| **Impacto** | Workout perdido en crash durante reset. |
| **Corrección** | Reemplazado `deleteWorkout` + `addWorkout` con `replaceWorkout` que ya usa `db.transaction('rw', db.workouts, ...)`. |

---

## Hallazgos documentados (no corregidos)

### CONC-05 — Sync periódico vs initialPull/Push sin coordinación
| Campo | Detalle |
|---|---|
| **Archivo** | `src/App.jsx:48-81` |
| **Escenario** | Login dispara `initialPullAll` → `initialPushAll`. Si durante este proceso (que puede tardar varios segundos) el interval de 5min se dispara, `sync()` ejecuta concurrentemente. El mutex `_syncing` protege `sync()`, pero no `initialPullAll/PushAll`. |
| **Impacto** | Bajo — `initialPull/Push` solo corre en el primer login y es secuencial (for loop). Las operaciones son idempotentes (upsert + bulkPut). El peor caso es trabajo duplicado, no corrupción. |
| **Solución recomendada** | Compartir el mutex entre `sync`, `initialPull` e `initialPush`. |
| **Estado** | Documentado. Bajo riesgo — el interval no se activa en los primeros 5min. |

### CONC-06 — Dos tabs crean workout simultáneamente
| Campo | Detalle |
|---|---|
| **Escenario** | Dos tabs abiertas. Ambas ejecutan `loadTodayWorkoutData`. Con CONC-02 corregido, la transacción serializa dentro del mismo tab. Pero **IndexedDB transactions no cruzan tabs** — son independientes. |
| **Impacto** | Bajo — el escenario es improbable (¿quién abre la app en dos tabs?). Si ocurre, ambas crean un workout diferente. El usuario ve datos distintos en cada tab. Al guardar, last-write-wins. |
| **Solución ideal** | Dexie `liveQuery` + `BroadcastChannel` para coordinar tabs. |
| **Estado** | Documentado. No vale la complejidad para este escenario. |

### CONC-07 — `importSchedule` crea rutinas + actualiza schedule sin transacción global
| Campo | Detalle |
|---|---|
| **Archivo** | `src/hooks/useRoutines.js:70-98` |
| **Escenario** | Import crea 5 rutinas secuencialmente (cada una un `addRoutine`). Si falla en la rutina 3, las rutinas 1-2 están creadas pero el schedule no se actualiza. |
| **Impacto** | Rutinas huérfanas sin schedule. No es corrupción — el usuario puede borrarlas manualmente. |
| **Solución ideal** | Envolver todo en `db.transaction('rw', db.routines, db.weeklySchedule, ...)`. |
| **Estado** | Documentado. El escenario es un fallo de IndexedDB mid-import, que es extremadamente raro. |

---

## Inventario de primitivas de sincronización

| Primitiva | Dónde se usa | Protege contra |
|-----------|-------------|---------------|
| `db.transaction('rw', ...)` | `finalizePastWorkouts`, `deleteRoutineAndClearSchedule`, `replaceWorkout`, `importAppData`, `exportAppData`, workout creation (CONC-02), settings (CONC-03), `clearRoutineFromSchedule` | Read-then-write atomicity en IndexedDB |
| `_syncing` mutex | `sync()` | Sync concurrente desde interval+online+login |
| `_syncStartedAt` timeout | `sync()` | Mutex stuck por Supabase timeout |
| `writeQueue` (Promise chain) | `persistWorkout` | Serialización de auto-saves rápidos |
| `structuredClone` | `persistWorkout` | Snapshot inmutable antes de async write |
| UUIDv4 idempotency | `addRoutine`, `addWorkout` | IDs únicos sin coordinación servidor |
| Supabase upsert | `pushTable` | Idempotencia de push (re-push del mismo ID no duplica) |

---

## Correcciones aplicadas

| # | Problema | Tipo | Fix |
|---|---------|------|-----|
| CONC-02 | Workout duplicado (check-then-act) | Race condition | `db.transaction('rw')` |
| CONC-03 | Settings lost update (read-merge-write) | Lost update | `db.transaction('rw')` |
| CONC-04 | Reset delete+add no atómico | Partial operation | `replaceWorkout` (transaccional) |

**91 tests, build OK.**
