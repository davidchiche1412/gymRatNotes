# Auditoría Técnica — GymRat Notes

**Fecha**: 2026-09-01  
**Versión auditada**: `695fd47`  
**Tamaño**: ~5800 LOC, 90 tests  
**Stack**: React 19 + Vite 8 + Dexie 4 + Supabase + Tailwind 4  
**Objetivo**: publicación Google Play a 1.99€

---

## Hallazgos

### #1 — Race condition en sync concurrente
| Campo | Detalle |
|---|---|
| **Severidad** | CRITICAL |
| **Archivo** | `src/db/sync.js:126-136` |
| **Problema** | `sync()` no tiene lock. El `setInterval` de 5min, el evento `online` y el primer login pueden disparar sync simultáneos. |
| **Por qué** | Dos push concurrentes leen los mismos `dirty: 1`, ambos suben, pero solo uno hace `dirty: 0`. |
| **Impacto** | Duplicación de datos en Supabase, sync inconsistente. |
| **Solución** | Añadir un mutex/flag `isSyncing` que impida ejecuciones concurrentes. |
| **Riesgo** | Bajo — es un guard simple. |
| **Prioridad** | P0 |

### #2 — `deleteWorkout` no marca `dirty` → soft-delete perdido en sync
| Campo | Detalle |
|---|---|
| **Severidad** | HIGH |
| **Archivo** | `src/db/queries/workouts.js:37` |
| **Problema** | `deleteWorkout(id)` hace `db.workouts.delete(id)` — borra localmente pero no comunica la eliminación a Supabase. Lo mismo con `deleteMeasurementById` y `deleteRoutineById`. |
| **Por qué** | En el siguiente pull, el registro remoto vuelve a aparecer. |
| **Impacto** | Los datos borrados por el usuario reaparecen tras sync. |
| **Solución** | Implementar soft-delete (`status: 'deleted'` + `dirty: 1`) o una tabla `deletedIds` que se sincronice. |
| **Riesgo** | Medio — requiere cambio en el modelo de datos. |
| **Prioridad** | P0 |

### #3 — `getPreviousDataMap` carga TODOS los workouts finalizados en memoria
| Campo | Detalle |
|---|---|
| **Severidad** | HIGH |
| **Archivo** | `src/hooks/useTodayWorkout.js:41` |
| **Problema** | `getFinishedWorkoutsNewestFirst()` carga la tabla completa. Con 365 workouts/año × datos de ejercicios, esto crece linealmente. El nested loop `O(ejercicios × workouts)` empeora. |
| **Por qué** | No hay filtro por rutina ni limit. |
| **Impacto** | Lentitud al abrir la app tras meses de uso, uso de memoria creciente. |
| **Solución** | Consulta indexada: buscar solo workouts del mismo `routineId`, limit 1 por ejercicio. |
| **Riesgo** | Bajo — Dexie soporta `.where().filter().first()`. |
| **Prioridad** | P1 |

### #4 — `finalizePastWorkouts` carga y reescribe sin transacción atómica
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivo** | `src/db/queries/workouts.js:47-61` |
| **Problema** | Lee todos los workouts pendientes, luego `bulkPut`. Si la app se cierra entre el read y el write, o si otro tab ejecuta lo mismo, puede haber inconsistencias. El filtro usa `.filter()` en vez de índice → table scan. |
| **Por qué** | No está envuelto en una transacción Dexie. |
| **Impacto** | Lentitud con muchos workouts, posible doble finalización. |
| **Solución** | Envolver en `db.transaction('rw', ...)` y usar `finishedAt` indexado. |
| **Riesgo** | Bajo. |
| **Prioridad** | P2 |

### #5 — Service Worker no se actualiza con el deploy
| Campo | Detalle |
|---|---|
| **Severidad** | HIGH |
| **Archivo** | `public/sw.js:1` |
| **Problema** | `CACHE_NAME = 'gymrat-notes-v23'` es manual. Cada deploy necesita bump manual de este número. Si se olvida, los usuarios sirven JavaScript viejo indefinidamente. |
| **Por qué** | El SW se cachea por el navegador y solo se actualiza si el contenido del archivo cambia. |
| **Impacto** | Usuarios en producción ejecutan código obsoleto sin saberlo. |
| **Solución** | Generar el SW con Vite (`vite-plugin-pwa`) o inyectar un hash del build en el nombre del cache. |
| **Riesgo** | Medio — cambio de herramienta de SW. |
| **Prioridad** | P1 |

### #6 — `initialPullAll` sobreescribe datos locales sin comparar timestamps
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivo** | `src/db/sync.js:155-171` |
| **Problema** | `bulkPut(data.map(config.deserialize))` sobreescribe todo lo local con lo remoto sin comparar `updatedAt`. |
| **Por qué** | Si el usuario editó offline antes del primer login, esos cambios se pierden. |
| **Impacto** | Pérdida de datos en primer login si hay datos locales y remotos. |
| **Solución** | Comparar `updatedAt` registro por registro como hace `pullTable`. |
| **Riesgo** | Bajo — reutilizar la lógica existente de `pullTable`. |
| **Prioridad** | P1 |

### #7 — `shared_routines` UPDATE sin ownership
| Campo | Detalle |
|---|---|
| **Severidad** | HIGH |
| **Archivo** | `supabase/schema.sql:127-130` |
| **Problema** | La policy de UPDATE es `auth.role() = 'authenticated'` sin check de `user_id`. Cualquier usuario autenticado puede sobreescribir la rutina compartida de otro. |
| **Por qué** | No existe columna `user_id` en las tablas `shared_routines` y `shared_schedules`. |
| **Impacto** | Inyección de datos maliciosos en rutinas que otros usuarios importan. |
| **Solución** | Añadir columna `user_id`, restringir UPDATE a `user_id = auth.uid()`, o hacer las tablas inmutables (solo INSERT, sin UPDATE). |
| **Riesgo** | Bajo — cambio de schema. |
| **Prioridad** | P1 |

### #8 — `validateAppBackup` no valida el contenido de cada row
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivo** | `src/utils/backup.js:14-37` |
| **Problema** | Solo verifica que cada tabla sea un array, pero `bulkPut` inyecta el contenido tal cual en IndexedDB. Un backup manipulado podría meter objetos con campos inesperados. |
| **Por qué** | No se validan tipos ni campos requeridos de cada registro. |
| **Impacto** | Corrupción de BD al importar backup manipulado. |
| **Solución** | Validar schema mínimo de cada row (al menos `id` presente y campos con tipo correcto). |
| **Riesgo** | Bajo. |
| **Prioridad** | P2 |

### #9 — `writeQueue` no maneja errores de escritura
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivo** | `src/hooks/useTodayWorkout.js:124` |
| **Problema** | `writeQueue.current = writeQueue.current.then(() => saveWorkout(snapshot))` — si una escritura falla, la cadena de promises se rompe y las escrituras siguientes nunca se ejecutan. |
| **Por qué** | No hay `.catch()` que mantenga viva la cadena. |
| **Impacto** | Pérdida silenciosa de datos del workout si IndexedDB falla una vez. |
| **Solución** | `.then(...).catch(err => console.error(err))` para mantener la cadena viva. |
| **Riesgo** | Bajo. |
| **Prioridad** | P1 |

### #10 — `savedTimeout` ref no se limpia al desmontar
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `src/hooks/useTodayWorkout.js:117,133-134` |
| **Problema** | `savedTimeout.current` no se limpia en el cleanup del useEffect. Si el componente se desmonta rápidamente, `setTimeout` intenta hacer `setShowSaved(false)` sobre un componente desmontado. |
| **Por qué** | Falta `useEffect(() => () => clearTimeout(savedTimeout.current), [])`. |
| **Impacto** | Warning de React en consola, sin efecto real. |
| **Solución** | Añadir cleanup en useEffect. |
| **Riesgo** | Bajo. |
| **Prioridad** | P3 |

### #11 — `getWorkouts()` sin filtro en historial → table scan completo
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivo** | `src/hooks/useHistoryWorkout.js:7` |
| **Problema** | `getWorkouts()` → `db.workouts.toArray()` carga toda la tabla, luego filtra en JS. |
| **Por qué** | No usa índices de Dexie ni paginación. |
| **Impacto** | Lentitud al abrir historial con muchos datos (200+ workouts con ejercicios embebidos). |
| **Solución** | Usar índice `date` con paginación o al menos filtrar en la query. |
| **Riesgo** | Bajo. |
| **Prioridad** | P2 |

### #12 — `useExerciseInfoMap` se re-ejecuta en cada cambio del array
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `src/hooks/useExerciseInfoMap.js:27` |
| **Problema** | `useEffect` depende de `exercises` que es un array nuevo en cada render del padre. Esto dispara queries innecesarias a IndexedDB. |
| **Por qué** | React compara arrays por referencia, no por contenido. |
| **Impacto** | Queries redundantes, latencia perceptible al editar rutina con muchos ejercicios. |
| **Solución** | Memoizar con `JSON.stringify(exercises.map(e => e.exerciseId))` como dependencia. |
| **Riesgo** | Bajo. |
| **Prioridad** | P3 |

### #13 — Sin Error Boundaries → crash de un componente mata la app
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivo** | `src/App.jsx` |
| **Problema** | No hay React Error Boundary. Un error en cualquier componente muestra pantalla blanca sin recuperación. |
| **Por qué** | React desmonta todo el árbol si un error no es capturado. |
| **Impacto** | App inutilizable hasta limpiar datos del navegador. |
| **Solución** | Añadir ErrorBoundary en App.jsx con UI de fallback y botón "reintentar" o "limpiar datos". |
| **Riesgo** | Bajo. |
| **Prioridad** | P1 |

### #14 — `serializeBodyMeasurement` incluye `dirty` en el payload remoto
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `src/db/sync.js:33-34` |
| **Problema** | `const { id, updatedAt, createdAt, ...rest } = row` — `rest` incluye `dirty` y `date` duplicado (campo propio + dentro de `data`). |
| **Por qué** | El destructuring no excluye `dirty`. |
| **Impacto** | Datos innecesarios en Supabase, potencial confusión. |
| **Solución** | Excluir `dirty` y `date` del spread rest. |
| **Riesgo** | Bajo. |
| **Prioridad** | P3 |

### #15 — No hay rate limiting en login
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivo** | `src/pages/auth/LoginPage.jsx:15-29` |
| **Problema** | Sin throttle en submit de login. Supabase tiene rate limiting propio, pero genera errores 429 que no se manejan con UI específica. |
| **Por qué** | El botón se rehabilita inmediatamente después de un error. |
| **Impacto** | UX pobre ante rate limiting, potencial bloqueo temporal de la cuenta. |
| **Solución** | Deshabilitar el botón 5s tras error, mostrar mensaje específico para 429. |
| **Riesgo** | Bajo. |
| **Prioridad** | P2 |

### #16 — Verificar idempotencia de `seed.js`
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `src/main.jsx:16` y `src/db/seed.js` |
| **Problema** | `initializeDatabase()` se llama en cada mount. Si usa `add()` sin verificar existencia, podría generar errores de PK duplicada. El archivo es >22KB — no se pudo verificar completamente. |
| **Por qué** | No hay evidencia visible de guard de idempotencia. |
| **Impacto** | Potenciales errores silenciosos al arrancar. |
| **Solución** | Verificar que comprueba si ya existe data antes de insertar. |
| **Riesgo** | Bajo. |
| **Prioridad** | P3 |

---

## Roadmap de mejoras

### Antes de publicar (P0 + P1)

| # | Hallazgo | Esfuerzo | Impacto |
|---|----------|----------|---------|
| 1 | #1 — Mutex en sync | 🟢 30min | Previene corrupción de datos |
| 2 | #2 — Soft-delete para sync | 🟡 2h | Datos borrados no reaparecen |
| 3 | #9 — writeQueue catch | 🟢 5min | Previene pérdida silenciosa |
| 4 | #13 — Error Boundary | 🟢 30min | App no muestra pantalla blanca |
| 5 | #5 — SW versioning automático | 🟡 1h | Usuarios reciben actualizaciones |
| 6 | #6 — initialPullAll comparar timestamps | 🟢 30min | No sobreescribe datos locales |
| 7 | #7 — RLS ownership en shared tables | 🟢 15min (SQL) | Evita sobreescritura maliciosa |
| 8 | #3 — Query optimizada previousDataMap | 🟢 30min | App rápida con historial largo |

### Post-lanzamiento (P2)

| # | Hallazgo | Esfuerzo | Impacto |
|---|----------|----------|---------|
| 9 | #4 — Transacción en finalizePastWorkouts | 🟢 15min | Atomicidad |
| 10 | #8 — Validar rows en importAppData | 🟡 1h | No corrompe BD con backup malo |
| 11 | #11 — Paginación/filtro en historial | 🟢 30min | Historial rápido |
| 12 | #15 — Rate limit en login UI | 🟢 15min | UX ante throttling |

### Cleanup técnico (P3)

| # | Hallazgo | Esfuerzo | Impacto |
|---|----------|----------|---------|
| 13 | #10 — Limpiar savedTimeout | 🟢 2min | Limpieza |
| 14 | #12 — Memoizar exerciseInfoMap deps | 🟢 10min | Menos queries |
| 15 | #14 — Excluir dirty de serialización | 🟢 5min | Datos limpios en Supabase |
| 16 | #16 — Verificar idempotencia de seed | 🟢 10min | Arranque seguro |
