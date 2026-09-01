# Auditoría de Rendimiento — GymRat Notes

**Fecha**: 2026-09-01  
**Versión auditada**: `df61489`

---

## Hallazgos y correcciones

### PERF-01 — `getPreviousDataMap` carga TODOS los workouts finalizados
| Campo | Detalle |
|---|---|
| **Severidad** | HIGH |
| **Archivo** | `src/hooks/useTodayWorkout.js:40-56` |
| **Problema** | `getFinishedWorkoutsNewestFirst()` carga la tabla completa de workouts. Luego un nested loop `O(exercises × workouts)` filtra solo los de la rutina actual. Con 365 workouts/año × ~5 ejercicios/workout, esto es ~1825 iteraciones innecesarias en el primer año. |
| **Por qué importa** | Se ejecuta **cada vez que se abre la app**. En un móvil de gama baja con 2 años de datos, puede tardar >500ms bloqueando el render de la pantalla principal. |
| **Corrección aplicada** | Nueva query `getFinishedWorkoutsByRoutine(routineId)` que filtra en IndexedDB. El loop se simplifica a un solo paso con Set de IDs pendientes — sale al primer match de cada ejercicio. De O(E × W) a O(W_rutina × E_workout). |
| **Reducción estimada** | ~90% menos datos cargados en memoria, ~10x más rápido con historial largo. |

### PERF-02 — `useStats` hace double fetch de workouts
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivo** | `src/hooks/useStats.js:54-76` |
| **Problema** | Dos `useEffect` separados llaman a `getFinishedWorkouts()`: uno al mount para PRs/ejercicios, otro al cambiar ejercicio/métrica/rango para la gráfica. Son dos table scans completos de la misma tabla. Además, cambiar cualquier filtro (métrica, rango) dispara un fetch completo de IndexedDB innecesario. |
| **Por qué importa** | La tabla workouts crece linealmente. Cada cambio de filtro recarga toda la tabla cuando los datos ya están en memoria. |
| **Corrección aplicada** | Los workouts se cargan una sola vez y se cachean en estado. El segundo `useEffect` filtra en memoria (síncrono) en vez de ir a IndexedDB. |
| **Reducción estimada** | -50% queries a IndexedDB en stats, filtros de gráfica instantáneos. |

### PERF-03 — `pullTable` hace N+1 queries a IndexedDB
| Campo | Detalle |
|---|---|
| **Severidad** | HIGH |
| **Archivo** | `src/db/sync.js:124-132` |
| **Problema** | Por cada registro remoto recibido, se hace `db[table].get(remote.id)` individual para comparar `updatedAt`. Con 50 registros nuevos en un pull = 50 queries secuenciales a IndexedDB. |
| **Por qué importa** | Cada `get()` de IndexedDB es una transacción IDB separada con overhead de microtask. 50 gets secuenciales en un móvil pueden tardar 200-500ms. |
| **Corrección aplicada** | Batch: `db[table].where('id').anyOf(remoteIds).toArray()` carga todos los locales en una sola query, luego compara en memoria con un Map. Escritura con `bulkPut` en vez de puts individuales. |
| **Reducción estimada** | De N+1 queries a 2 queries (1 read + 1 bulk write). ~10x más rápido en sync. |

### PERF-04 — `useExerciseInfoMap` re-fetches en cada render
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `src/hooks/useExerciseInfoMap.js` |
| **Problema** | `useEffect` depende de `exercises` (array), que es una nueva referencia en cada render del padre (`RoutineEditor`). Esto dispara una query a IndexedDB cada vez que el usuario cambia cualquier campo (sets, peso, reps), no solo cuando cambian los ejercicios. |
| **Por qué importa** | En una rutina con 5 ejercicios, editar un campo de texto dispara una query de 5 ejercicios innecesaria. Latencia perceptible en móviles lentos. |
| **Corrección aplicada** | Dependencia estable: `useMemo` genera un string de IDs ordenados (`"id1,id2,id3"`). Solo re-fetch cuando los IDs reales cambian. |
| **Reducción estimada** | ~90% menos queries de ejercicios al editar rutinas. |

---

## Hallazgos documentados (no corregidos — bajo impacto actual)

### PERF-05 — `getHistoryData` full table scan
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivo** | `src/hooks/useHistoryWorkout.js:11` |
| **Problema** | `getWorkouts()` → `db.workouts.toArray()` carga TODOS los workouts (incluyendo `not_started`), luego filtra en JS. No hay paginación. |
| **Impacto actual** | Bajo con <100 workouts. Crece linealmente. |
| **Recomendación** | Añadir paginación (limit 20, load more on scroll) y filtrar con índice `date` en Dexie. |
| **Prioridad** | Corregir cuando haya >200 workouts reportados por usuarios. |

### PERF-06 — `finalizePastWorkouts` usa `.filter()` en vez de índice
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `src/db/queries/workouts.js:47-61` |
| **Problema** | `.where('date').below(ts).filter(w => w.finishedAt == null)` — el `.filter()` es una función JS que se evalúa por cada resultado del índice `date`. No puede usar el índice `finishedAt`. |
| **Impacto actual** | Bajo — solo se ejecuta una vez al abrir la app y el número de workouts no finalizados de días anteriores debería ser 0-2. |
| **Recomendación** | Añadir índice compuesto `[date+finishedAt]` si el volumen crece. |

### PERF-07 — `RoutineEditor` carga ALL finished workouts para 1RM
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `src/pages/routines/RoutineEditor.jsx:39` |
| **Problema** | `getFinishedWorkouts().then(setWorkouts)` carga todos los workouts finalizados solo para calcular 1RM en `DraggableExerciseList`. El 1RM es un panel expandible que la mayoría de usuarios no abrirán. |
| **Recomendación** | Lazy load: cargar workouts solo cuando el usuario expande el primer panel 1RM. |

### PERF-08 — `buildMaxWeightData` y `buildVolumeData` hacen `.sort()` en cada llamada
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `src/utils/stats.js:15,88` |
| **Problema** | `workouts.slice().sort(...)` crea una copia y ordena en cada cambio de filtro. Con 100 workouts esto es trivial (<1ms). |
| **Recomendación** | Pre-ordenar en el hook al cargar. No priorizar. |

### PERF-09 — `sync` push/pull en paralelo puede saturar conexión móvil
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `src/db/sync.js:143-144` |
| **Problema** | `Promise.all(CONFIGS.map(c => pushTable(...)))` lanza 6 upserts simultáneos, luego 6 selects simultáneos. En 3G/4G lento esto puede congestionar. |
| **Recomendación** | Limitar concurrencia a 3 tablas simultáneas con un pool. No priorizar — Supabase maneja bien conexiones concurrentes. |

---

## Resumen de impacto

| Fix | Queries eliminadas | Datos en memoria | Latencia |
|-----|--------------------|------------------|----------|
| PERF-01 | -1 full table scan/app open | -90% workouts cargados | -10x en apertura |
| PERF-02 | -1 full table scan/filtro | Cero (cachea en estado) | Filtros instantáneos |
| PERF-03 | -N queries/sync | Batch en 2 queries | -10x en sync |
| PERF-04 | -N queries/campo editado | Cero (memoiza IDs) | Sin flicker al editar |

**Total**: 4 optimizaciones aplicadas, 5 documentadas para futuro. 91 tests, build OK.
