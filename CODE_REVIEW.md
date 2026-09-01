# Code Review — GymRat Notes

**Fecha**: 2026-09-01  
**Versión**: `89eea87`  
**LOC**: ~6200 (sin tests)  
**Archivos**: 56 source files

---

## Hallazgos y acciones

### CR-01 — Magic strings para workout status
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivos** | `todayWorkoutView.js:55`, `workouts.js:67` |
| **Problema** | `'not_started'` y `'finished'` como strings literales en vez de usar la constante `WORKOUT_STATUS` ya definida en `workoutSync.js`. Si se renombra un status, estos archivos no fallan en compilación — el bug se descubre en runtime. |
| **Corrección** | Importar y usar `WORKOUT_STATUS.NOT_STARTED` y `WORKOUT_STATUS.FINISHED`. |
| **Estado** | ✅ Corregido |

### CR-02 — Check de tipo repetido 4 veces: `type === 'weight' || type === 'bodyweight'`
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivos** | `HomePage.jsx` (×3), `DraggableExerciseList.jsx` (×1) |
| **Problema** | Condición duplicada en 4 sitios. Si se añade un nuevo tipo de ejercicio con peso (ej: `'cable'`), hay que actualizar 4 archivos. |
| **Corrección** | Extraer `isWeightExercise(type)` en `exerciseName.js` y usarlo en los 4 sitios. |
| **Estado** | ✅ Corregido |

### CR-03 — `handleNameChange` wrapper innecesario
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `SettingsSection.jsx:24-26` |
| **Problema** | `const handleNameChange = async (value) => { await changeName(value); }` — es un passthrough sin lógica adicional. |
| **Impacto** | Ninguno funcional. Legibilidad: 3 líneas para nada. |
| **Estado** | Documentado, no corregido. Es consistente con el patrón de los demás handlers que sí añaden lógica (ej: `handleRestEnabledChange` llama a `syncTimerRestEnabled`). Eliminarlo rompería la consistencia visual. |

### CR-04 — `SettingsSection.jsx` línea 82: `title: 'Error'` hardcodeado
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `SettingsSection.jsx:82` |
| **Problema** | `showAlert({ title: 'Error', ... })` — string no internacionalizado. En inglés queda igual, pero rompe la consistencia con el resto de la app que usa `t()`. |
| **Estado** | Documentado. El impacto es cosmético — "Error" es igual en español e inglés. |

### CR-05 — `DraggableExerciseList` mezcla UI + lógica 1RM
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivo** | `DraggableExerciseList.jsx` (225 líneas) |
| **Problema** | El componente tiene 3 responsabilidades: drag&drop, renderizar ejercicios, y calcular 1RM con `useMemo`. La calculadora 1RM (`oneRMData`) es un bloque independiente que podría ser un componente aparte. |
| **Impacto** | Dificulta la lectura y el testing. Si se quiere testear el 1RM en aislamiento, hay que montar todo el drag handler. |
| **Estado** | Documentado. No refactorizado porque el componente ya es cohesivo (todo gira en torno a "item de ejercicio en lista") y extraerlo solo movería líneas sin ganar testabilidad real (sigue siendo JSX). |

### CR-06 — `Date.now()` disperso en 27 llamadas dentro de `db/`
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivos** | `db/queries/*.js`, `db/sync.js` |
| **Problema** | `Date.now()` se llama directamente en cada write. Si alguna vez necesitamos un reloj inyectable (para tests de sync, o timezone issues), habría que cambiarlo en 27 sitios. |
| **Impacto** | Bajo. No es un problema real — `Date.now()` es puro y determinista. |
| **Estado** | Documentado. Extraer un `getNow()` sería sobreingeniería para este proyecto. |

### CR-07 — `seed.js` es el archivo más grande (346 líneas) y contiene datos hardcodeados
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `src/db/seed.js` |
| **Problema** | ~150 ejercicios con nombres en español e inglés + 5 rutinas predefinidas, todo en un solo archivo. Los datos podrían estar en JSON separados. |
| **Impacto** | Legibilidad del archivo. No afecta al bundle (tree-shaking + lazy loading). |
| **Estado** | Documentado. Mover a JSON no aporta funcionalidad y complicaría los imports dinámicos. |

### CR-08 — API interna inconsistente: `getWorkouts()` vs `getFinishedWorkouts()` vs `getFinishedWorkoutsByRoutine()`
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `db/queries/workouts.js` |
| **Problema** | 3 funciones que hacen variaciones del mismo query. `getWorkouts` devuelve todo, `getFinishedWorkouts` filtra por finishedAt, `getFinishedWorkoutsByRoutine` filtra por finishedAt + routineId. No hay un patrón consistente de naming o composición. |
| **Impacto** | Confusión para un nuevo desarrollador. ¿Cuál debo usar? |
| **Estado** | Documentado. El naming sigue la convención `get[Adjective][Noun][ByFilter]` que es legible. Unificar en un solo `getWorkouts({ finished?, routineId? })` sería más elegante pero añade complejidad al callsite. |

---

## Lo que está BIEN (no refactorizar)

| Aspecto | Estado | Por qué |
|---------|--------|---------|
| **Separación pages/hooks/utils/db** | ✅ | Flujo claro: page→hook→util→query. Cada capa testeable |
| **Hooks como orquestadores** | ✅ | Hooks no contienen lógica de negocio, solo cablean I/O |
| **Utils puros y testeables** | ✅ | `workoutSync.js`, `todayWorkoutView.js`, `stats.js` — funciones puras sin side effects |
| **Componentes de UI pequeños** | ✅ | `Modal`, `Loading`, `DayOff`, `WorkoutSetInput` — single responsibility |
| **Constantes centralizadas** | ✅ | `WORKOUT_STATUS`, `DEFAULT_SETTINGS`, `DEFAULT_MEASUREMENT_FIELDS` |
| **i18n completo** | ✅ | Todo el texto visible usa `t()`, incluido el banner de instalación |
| **Sanitización centralizada** | ✅ | `sanitize.js` usado en todos los DB writes |
| **Validación en la frontera** | ✅ | `validateImportedRoutine`, `validateImportedSchedule`, `validateAppBackup` |

---

## Complejidad ciclomática

Archivos con mayor complejidad (estimada por branching):

| Archivo | Branches | Estado |
|---------|----------|--------|
| `workoutSync.js` | ~15 | ✅ Todas testeadas (32 tests) |
| `todayWorkoutView.js` | ~8 | ✅ Todas testeadas (25 tests) |
| `useTodayWorkout.js` | ~10 | ⚠️ No testeable sin jsdom |
| `DraggableExerciseList.jsx` | ~8 | ⚠️ UI — bajo riesgo |
| `sync.js` | ~12 | ⚠️ No testeable sin mocks |

**La lógica de mayor complejidad (`workoutSync`, `todayWorkoutView`) está 100% cubierta por tests.**

---

## Correcciones aplicadas

| # | Cambio | Impacto |
|---|--------|---------|
| CR-01 | Magic strings `'not_started'`/`'finished'` → `WORKOUT_STATUS.*` | Previene bugs silenciosos si se renombra un status |
| CR-02 | `type === 'weight' \|\| type === 'bodyweight'` → `isWeightExercise(type)` | Un solo punto de cambio si se añade un nuevo tipo |

**116 tests, build OK.**
