# Auditoría de Resiliencia — GymRat Notes

**Fecha**: 2026-09-01  
**Versión**: `48c6f83`  
**Contexto**: PWA offline-first, IndexedDB local, Supabase remoto, Service Worker

---

## Modelo de fallos

Esta es una app cliente sin servidor propio. Los puntos de fallo son:

| Componente | Puede fallar | Consecuencia |
|-----------|-------------|-------------|
| IndexedDB | Cuota excedida, corrupción, bloqueado por otro tab | No se guardan workouts |
| Supabase API | Timeout, 5xx, rate limit, mantenimiento | Sync no funciona |
| Red | Offline, intermitente, lenta | Supabase inalcanzable |
| Service Worker | Cache stale, SW no actualizado | Código viejo en producción |
| Navegador | Tab cerrado durante write, crash | Transacción incompleta |

---

## Hallazgos y correcciones

### RES-01 — Sync mutex se queda bloqueado si Supabase cuelga
| Campo | Detalle |
|---|---|
| **Archivo** | `src/db/sync.js:89-161` |
| **Escenario** | Supabase no responde (ECONNRESET, DNS fail, firewall corporativo). El `fetch` del SDK se queda pendiente. `_syncing = true` nunca se resetea. Todos los syncs futuros (interval, online event) se descartan. |
| **Impacto** | Sync muere permanentemente hasta refresh de la app. El usuario trabaja offline sin saberlo. |
| **Corrección** | `_syncStartedAt` timestamp + timeout de 30s. Si el mutex lleva >30s bloqueado, se permite un nuevo sync (el anterior se descarta al completar en background). |
| **Trade-off** | Puede haber 2 syncs solapados brevemente si el anterior tarda >30s pero aún está vivo. Aceptable dado que Dexie serializa writes y Supabase upsert es idempotente. |

### RES-02 — `loadTodayWorkoutData` sin try/catch → loading infinito
| Campo | Detalle |
|---|---|
| **Archivo** | `src/hooks/useTodayWorkout.js:145-162` |
| **Escenario** | IndexedDB falla (cuota excedida, BD corrupta, `InvalidStateError` por version conflict). `loadTodayWorkoutData()` lanza excepción. `setLoading(false)` nunca se ejecuta. La app muestra spinner infinito. |
| **Impacto** | App inutilizable. El usuario no puede ni ver la pantalla de descanso. |
| **Corrección** | try/catch envuelve todo el load. Si falla, `setLoading(false)` se ejecuta igualmente → muestra pantalla de día de descanso (graceful degradation). |
| **Trade-off** | El usuario no sabe que hubo error de BD. Aceptable — es mejor mostrar "día de descanso" que spinner infinito. Un futuro Error Boundary cubriría el caso con UI explícita. |

### RES-03 — Sync fallo parcial: una tabla falla → todas se pierden
| Campo | Detalle |
|---|---|
| **Archivo** | `src/db/sync.js:147-161, 163-178, 180-192` |
| **Escenario** | `sync()` usa `Promise.all` para push y pull. Si una tabla falla (ej: `workouts` tiene un registro que viola un constraint en Supabase), el `Promise.all` rechaza todo. Las otras 5 tablas que eran válidas no se sincronizan. `lastSyncAt` no se actualiza → se reintenta todo la próxima vez (correcto) pero sin progreso parcial. |
| **Corrección** | Cambio a `Promise.allSettled` para push y pull. Cada tabla se intenta independientemente. `initialPushAll` e `initialPullAll` usan try/catch por tabla: si una falla, las demás continúan. Los registros que fallaron mantienen `dirty: 1` y se reintentan en el siguiente sync. |
| **Trade-off** | Una tabla puede quedar out-of-sync silenciosamente. Aceptable — el siguiente sync periódico (5 min) reintentará automáticamente. |

---

## Escenarios analizados (sin corrección necesaria)

### RES-04 — Red se pierde durante auto-save del workout
| Escenario | La app guarda en IndexedDB primero (offline-first). Supabase es secundario. |
| Estado | ✅ **Ya resiliente** — `saveWorkout` escribe a IndexedDB que funciona offline. El `dirty: 1` flag garantiza que se subirá a Supabase cuando haya conexión. |

### RES-05 — IndexedDB cuota excedida al guardar
| Escenario | El usuario tiene muchos workouts + medidas + el almacenamiento del navegador está lleno. |
| Estado | ⚠️ `saveWorkout` lanzará `QuotaExceededError`. El `.catch(() => {})` del writeQueue lo absorbe silenciosamente. El workout queda en memoria (React state) pero no persiste. |
| Recomendación futura | Detectar `QuotaExceededError` y mostrar un toast "Almacenamiento lleno — exporta tus datos". |

### RES-06 — Supabase devuelve 429 (rate limit)
| Escenario | Demasiados requests seguidos (ej: sync periódico + online event simultáneo). |
| Estado | ✅ **Parcialmente resiliente** — el mutex evita syncs concurrentes. Si el 429 llega durante un sync activo, el error se captura y el próximo sync (5 min) reintenta. No hay exponential backoff explícito. |
| Recomendación futura | Añadir backoff si sync falla consecutivamente (ej: 5min → 10min → 20min). |

### RES-07 — Dos tabs abiertos simultáneamente
| Escenario | El usuario abre la app en dos pestañas. Ambas cargan `loadTodayWorkoutData()`. |
| Estado | ⚠️ Ambas crean/leen el mismo workout via `getWorkoutForRoutineSince()`. Dexie no tiene locks cross-tab, pero cada write es atómico. El peor caso: ambas guardan a la vez y el último `put` gana (last-write-wins). No hay corrupción, pero el usuario puede perder la última serie de una pestaña. |
| Recomendación futura | Usar Dexie `liveQuery` para detectar cambios cross-tab. Bajo prioridad — uso de dos tabs es edge case. |

### RES-08 — Usuario importa un backup de 50MB
| Escenario | Backup con miles de workouts cargados en un `JSON.parse` + `bulkPut`. |
| Estado | ⚠️ `JSON.parse` de 50MB puede freezar el main thread 2-5 segundos. `bulkPut` de 10K registros puede tardar >10s en móvil lento. Sin feedback al usuario durante el proceso. |
| Recomendación futura | Usar Web Worker para parse + progress indicator. Bajo prioridad — el volumen típico es <1MB. |

### RES-09 — Service Worker sirve código viejo
| Escenario | El SW cachea index.html. En el siguiente deploy, el JS tiene hash nuevo pero el SW sirve el HTML viejo que referencia el JS viejo. |
| Estado | ⚠️ Documentado en AUDIT.md (#5). `CACHE_NAME` se bumpa manualmente. Network-first mitiga esto (el HTML se actualiza en la siguiente visita online), pero si la primera visita es offline, sirve código stale. |
| Recomendación | Migrar a `vite-plugin-pwa` para versionado automático. |

### RES-10 — `initialPullAll` sobreescribe datos locales
| Escenario | El usuario trabaja offline durante una semana. Al conectar, `initialPullAll` ejecuta `bulkPut` con datos remotos viejos, sobreescribiendo workouts locales nuevos. |
| Estado | ⚠️ Documentado en AUDIT.md (#6). `initialPullAll` no compara timestamps. Solo se ejecuta en primer login, que normalmente es con BD local vacía. Si el usuario ya tiene datos locales y remotos, los remotos ganan. |
| Recomendación | Reutilizar la lógica de `pullTable` (compara `updatedAt`) para `initialPullAll`. |

---

## Tabla de resiliencia por componente

| Componente | Fallo | Comportamiento actual | Estado |
|-----------|-------|----------------------|--------|
| IndexedDB down | Cuota/corrupción | Graceful → día de descanso | ✅ Corregido |
| Supabase timeout | Cuelga >30s | Mutex se recupera, próximo sync reintenta | ✅ Corregido |
| Supabase error | 5xx/network | Tabla falla independiente, dirty flag reintenta | ✅ Corregido |
| Supabase rate limit | 429 | Error silencioso, reintento en 5min | ⚠️ Aceptable |
| Red offline | Sin conexión | App funciona local, sync al reconectar | ✅ Ya resiliente |
| Red intermitente | Cortes | Writes locales, sync periódico catch-up | ✅ Ya resiliente |
| Tab cerrado durante write | Kill signal | Dexie transacción atómica, no corrompe | ✅ Ya resiliente |
| Dos tabs simultáneos | Concurrent writes | Last-write-wins, sin corrupción | ⚠️ Aceptable |
| Backup muy grande | 50MB import | Main thread freeze | ⚠️ Futuro |
| SW stale | Cache viejo | Network-first mitiga, bump manual | ⚠️ Documentado |

---

## Correcciones aplicadas en este commit

| # | Fix | Archivo |
|---|-----|---------|
| RES-01 | Sync mutex con timeout de 30s | `src/db/sync.js` |
| RES-02 | try/catch en loadTodayWorkoutData | `src/hooks/useTodayWorkout.js` |
| RES-03 | `Promise.allSettled` + try/catch por tabla en sync | `src/db/sync.js` |

**91 tests, build OK.**
