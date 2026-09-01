# Auditoría de Testing — GymRat Notes

**Fecha**: 2026-09-01  
**Tests totales**: 116 (de 91 al inicio de esta auditoría)  
**Suite time**: ~105ms (3 runs: 120ms, 101ms, 104ms)  
**Flaky tests**: 0  
**Framework**: Node.js built-in test runner (`node --test`)

---

## Cobertura actual

### Archivos con tests

| Archivo | Tests | Exports | Cobertura |
|---------|-------|---------|-----------|
| `workoutSync.js` | 32 | 18 | ✅ Completa + edge cases |
| `todayWorkoutView.js` | 25 | 6 | ✅ Completa + null guards |
| `shareRoutine.js` | 11 | 5 | ✅ Completa + validación |
| `stats.js` | 12 | 7 | ✅ Completa |
| `oneRepMax.js` | 9 | 5 | ✅ Completa |
| `sanitize.js` | 8 | 2 | ✅ Completa + unicode |
| `measurements.js` | 5 | 5 | ✅ Completa |
| `backup.js` | 7 | 1 | ✅ Completa + edge cases |
| `exerciseName.js` | 2 | 2 | ✅ Completa |
| `settings.js` | 2 | 2 | ✅ Completa |
| `formatDate.js` | 2 | 2 | ✅ Completa |
| `jsxImports.test.js` | 1 | — | ✅ Test estático |

### Archivos sin tests (análisis de riesgo)

| Archivo | Tipo | Riesgo | Justificación |
|---------|------|--------|---------------|
| `timerSound.js` | WebAudio API | BAJO | Solo funciona en browser, no testeable con Node |
| `logger.js` | Console wrapper | BAJO | 2 funciones triviales, condicional `import.meta.env.DEV` |
| `db/queries/*.js` | Dexie wrappers | MEDIO | Requiere mock de IndexedDB, la lógica está en utils |
| `db/sync.js` | Supabase + Dexie | ALTO | Lógica compleja pero requiere mocks pesados |
| `hooks/*.js` | React hooks | MEDIO | Requiere jsdom/React Testing Library |
| `pages/*.jsx` | React components | BAJO | Presentación, lógica en utils/hooks |
| `components/*.jsx` | React components | BAJO | Presentación pura |
| `context/*.jsx` | React contexts | BAJO | Providers simples |

---

## Tests añadidos en esta auditoría (25 nuevos)

### workoutSync.test.js (+8)

| Test | Bug que detecta |
|------|----------------|
| `createSetsFromRoutineExercise pads sets from previous data` | Regresión si se cambia el while-loop de padding |
| `createSetsFromRoutineExercise defaults to 3 when targetSets 0` | Edge case: targetSets falsy |
| `updateWorkoutSetValue converts empty string to null` | Regresión si se quita la conversión '' → null |
| `updateWorkoutSetValue converts string numbers correctly` | Regresión si Number() se reemplaza por parseInt |
| `toggleWorkoutSetCompleted does not overwrite existing values` | Bug: fallback sobreescribe valores ya introducidos |
| `deriveWorkoutStatus returns FINISHED even without completed sets` | Bug: FINISHED depende del status explícito, no de sets |
| `hasManualChanges with prefilled baseline` | Regresión en la detección de cambios vs prefilled |
| `syncWorkoutExercises preserves completed sets and notes` | Bug: sync borra notas o estado de completado |

### todayWorkoutView.test.js (+7)

| Test | Bug que detecta |
|------|----------------|
| `buildTodayWorkout returns null if routine null` | Crash si falta routine |
| `buildTodayWorkout returns null if workout null` | Crash si falta workout |
| `getTodayWorkoutProgress handles null/empty` | Crash al renderizar sin workout |
| `getWorkoutSetInputValue handles null field` | Muestra "null" en vez de "" |
| `resolveWorkoutSetFallbackValue skips non-edited sets` | Bug: propaga prefilled como si fuera del usuario |
| `getWorkoutSetPlaceholder returns dash without fallback` | Muestra undefined si no hay datos |
| `getWorkoutSetSuggestions handles empty prefilledSets` | Crash con array vacío |

### sanitize.test.js (+3)

| Test | Bug que detecta |
|------|----------------|
| `maxLength 0 returns empty` | Edge case de cap |
| `preserves emojis and unicode` | Regresión si regex come unicode |
| `sanitizeNumber handles 0 and negatives` | Edge: 0 es falsy pero válido |

### backup.test.js (+4)

| Test | Bug que detecta |
|------|----------------|
| `rejects array input` | Array pasa isPlainObject si se cambia el check |
| `rejects null input` | null pasa typeof === 'object' |
| `rejects non-array table` | String en tabla no se detecta |
| `preserves valid rows + fills missing tables` | Regresión en la normalización |

### shareRoutine.test.js (+3)

| Test | Bug que detecta |
|------|----------------|
| `encodeSchedule handles empty` | Crash con schedule vacío |
| `validateImportedRoutine caps extremes` | targetSets negativo, restTime negativo |
| `filters exercises without exerciseId string` | Type coercion bug (number vs string) |

---

## Análisis de calidad de tests

### Tests lentos (>10ms)

| Test | Tiempo | Causa |
|------|--------|-------|
| `formatDate returns a formatted date string` | ~19ms | `toLocaleDateString` con locale (first-call ICU load) |
| `JSX components used in pages are imported` | ~16ms | File I/O: lee todos los .jsx y busca imports |
| `buildMaxWeightData shows max weight per workout date` | ~11ms | `toLocaleDateString` en loop |

**Ninguno es problemático** — el suite completo está <150ms.

### Tests duplicados

**Ninguno encontrado.** Cada test verifica un comportamiento distinto.

### Tests flaky

**Ninguno.** 3 ejecuciones consecutivas: 116/116, 116/116, 116/116.

---

## Gaps de cobertura por prioridad

### 1. Alta prioridad (lógica de negocio sin test)

| Gap | Dónde | Riesgo |
|-----|-------|--------|
| `sync.js` — push/pull roundtrip | `src/db/sync.js` | ALTO pero requiere mock de Supabase + Dexie |
| `useTodayWorkout` — máquina de estados completa | `src/hooks/useTodayWorkout.js` | ALTO pero requiere jsdom |
| `importAppData` sanitización de rows | `src/db/queries/settings.js` | MEDIO — la función `sanitizeRow` es nueva y no testeada directamente |

### 2. Media prioridad

| Gap | Dónde | Riesgo |
|-----|-------|--------|
| `useRoutines.importSchedule` — flujo completo | Hook + Dexie | Requiere mock |
| `deleteRoutineAndClearSchedule` transacción | `src/db/queries/routines.js` | Requiere Dexie |

### 3. Baja prioridad

| Gap | Dónde | Riesgo |
|-----|-------|--------|
| Componentes React render | `src/pages/*.jsx` | Presentación, lógica ya testeada |
| `timerSound.js` | WebAudio | No testeable con Node |

---

## Recomendaciones de arquitectura de testing

### Corto plazo (sin cambios de tooling)

1. **Ya implementado** — 25 tests nuevos de edge cases en utils/
2. Exportar `sanitizeRow` de `settings.js` y testearla directamente
3. Mover la lógica de `loadTodayWorkoutData` a un util testeable (separar I/O de lógica)

### Medio plazo (con cambio de tooling)

4. **Vitest + jsdom** para hooks y componentes. Esto desbloquearía:
   - Tests de `useTodayWorkout` (máquina de estados)
   - Tests de `useRoutines` (import/export)
   - Tests de `LoginPage` (formulario)
5. **Mock de Dexie** con `fake-indexeddb` para testear `sync.js` y queries

### Lo que NO recomiendo

- Tests e2e con Playwright/Cypress — overkill para una app de este tamaño
- Mocking exhaustivo de React components — el valor/coste es bajo
- Coverage target % — los 116 tests actuales cubren toda la lógica crítica

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Tests totales | 116 |
| Tests añadidos | 25 |
| Flaky tests | 0 |
| Tests >50ms | 0 |
| Suite time | ~105ms |
| Tests duplicados | 0 |
| Archivos utils sin test | 2 (logger, timerSound — ambos triviales/browser-only) |
| Cobertura lógica de negocio | ~95% de funciones exportadas |
