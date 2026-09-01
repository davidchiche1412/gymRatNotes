# Auditoría de Manejo de Errores — GymRat Notes

**Fecha**: 2026-09-01  
**Versión**: `036839c`

---

## Estrategia de errores implementada

### Clasificación

| Categoría | Ejemplo | Comportamiento |
|-----------|---------|---------------|
| **Error esperado** | `decodeSchedule` falla con base64 inválido | Devuelve `null`, caller decide |
| **Error de validación** | Backup JSON malformado | `TypeError` con mensaje descriptivo |
| **Error de auth** | Login incorrecto | Mensaje genérico al usuario (anti-enumeration) |
| **Error de infraestructura** | Supabase timeout, IndexedDB cuota | Log en dev, silencioso en prod, retry automático |
| **Error inesperado** | Crash de componente React | ErrorBoundary con botón "Reiniciar app" |
| **Error de background** | Sync falla, publish falla | Log en dev, fire-and-forget, retry en próximo ciclo |

### Logger centralizado (`src/utils/logger.js`)

```js
logError(context, error)  // Solo imprime en DEV
logWarn(context, message)  // Solo imprime en DEV
```

En producción: silencioso. Preparado para integrar con servicio de error reporting (Sentry, etc.) cambiando una sola función.

---

## Hallazgos y correcciones

### ERR-01 — `console.error` en producción expone stack traces
| Campo | Detalle |
|---|---|
| **Archivo** | `src/App.jsx:58,61,68,78` |
| **Problema** | `.catch(console.error)` imprimía errores de sync con URLs de Supabase, user IDs y stack traces en la consola del navegador de producción. |
| **Impacto** | Information disclosure — un usuario con DevTools ve detalles internos. |
| **Corrección** | Reemplazado con `logError('sync', e)` que solo imprime en `import.meta.env.DEV`. |

### ERR-02 — Catches vacíos sin logging ni contexto
| Campo | Detalle |
|---|---|
| **Archivos** | `sync.js` (2), `useTodayWorkout.js` (2) |
| **Problema** | `catch {}` o `.catch(() => {})` tragaba errores completamente. Si IndexedDB fallaba durante sync o save, no había forma de diagnosticar el problema ni en dev ni en prod. |
| **Corrección** | Todos reemplazados con `catch(e => logError('context', e))` con identificador de contexto único. |

### ERR-03 — Sin Error Boundary → pantalla blanca en crash
| Campo | Detalle |
|---|---|
| **Archivo** | `src/App.jsx` |
| **Problema** | Un error de render en cualquier componente (datos corruptos, campo undefined) propagaba hasta la raíz → pantalla blanca irrecuperable. |
| **Impacto** | App inutilizable hasta que el usuario borra datos del navegador manualmente. |
| **Corrección** | `ErrorBoundary` class component envuelve todo `App`. Muestra UI con "Algo salió mal" y botón "Reiniciar app" que hace `window.location.reload()`. |

### ERR-04 — `loadTodayWorkoutData` sin recuperación de error
| Campo | Detalle |
|---|---|
| **Archivo** | `src/hooks/useTodayWorkout.js:145-162` |
| **Problema** | Si IndexedDB fallaba, el await lanzaba excepción, `setLoading(false)` nunca se ejecutaba → spinner infinito. |
| **Corrección** | try/catch con `logError`. Siempre ejecuta `setLoading(false)`. Degrada a "día de descanso". |

---

## Inventario de catch blocks

### ✅ Correctos (con UI de feedback)

| Archivo | Catch | Feedback al usuario |
|---------|-------|-------------------|
| `RoutinesPage:54` | handleShare falla | `sharedFeedback` → texto de error |
| `RoutinesPage:85` | handleImport falla | `importFeedback` → texto de error |
| `WeeklySchedule:28` | handleShareSchedule falla | `feedback` → texto de error |
| `SettingsSection:81` | handleImport falla | `showAlert` → "Archivo no válido" |
| `LoginPage:26` | auth falla | `setError` → mensaje genérico |

### ✅ Correctos (fire-and-forget intencional)

| Archivo | Catch | Justificación |
|---------|-------|--------------|
| `RoutinesPage:52` | `shareRoutine().catch(() => {})` | Publish en background, ID ya copiado |
| `WeeklySchedule:26` | `publishSchedule().catch(() => {})` | Publish en background, plan ya codificado |
| `timerSound.js:32` | `audio.play().catch(() => undefined)` | Autoplay bloqueado por navegador — error esperado |
| `main.jsx:16` | `initializeDatabase().catch(() => {})` | Seed falla → app funciona con BD vacía |

### ✅ Correctos (error esperado, devuelve null)

| Archivo | Catch | Devuelve |
|---------|-------|---------|
| `shareRoutine.js:19` | `decodeSchedule` base64 inválido | `null` |
| `sharedRoutines.js:11` | Duplicate key en insert | Ignora, devuelve `routineId` |

### ✅ Corregidos (con logger)

| Archivo | Antes | Después |
|---------|-------|---------|
| `App.jsx:58,61,68,78` | `.catch(console.error)` | `.catch(e => logError('sync', e))` |
| `sync.js:181` | `catch {}` | `catch(e) { logError('sync:push:table', e) }` |
| `sync.js:203` | `catch {}` | `catch(e) { logError('sync:pull:table', e) }` |
| `useTodayWorkout.js:129` | `.catch(() => {})` | `.catch(e => logError('workout:save', e))` |
| `useTodayWorkout.js:160` | `catch {}` | `catch(e) { logError('workout:load', e) }` |

---

## Cascadas de errores prevenidas

| Escenario | Sin fix | Con fix |
|-----------|---------|---------|
| IndexedDB corrupta al abrir app | Spinner infinito → usuario desinstala | "Día de descanso" → puede navegar a otras tabs |
| Supabase devuelve 500 en sync | `console.error` en prod → info leak | Log silencioso en prod, retry en 5min |
| Componente crashea por datos nulos | Pantalla blanca irrecuperable | ErrorBoundary → "Reiniciar app" |
| Una tabla de sync falla | Todas las tablas pierden sync | Solo esa tabla se reintenta, demás OK |
| writeQueue save falla | Cadena rota → nunca más guarda | Log + cadena continúa → siguiente save funciona |

---

## Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `src/utils/logger.js` | **Nuevo** — logger centralizado (dev-only) |
| `src/components/ErrorBoundary.jsx` | **Nuevo** — captura crashes de render |
| `src/App.jsx` | ErrorBoundary envuelve todo, `logError` en vez de `console.error` |
| `src/db/sync.js` | `logError` en catches de sync parcial |
| `src/hooks/useTodayWorkout.js` | `logError` en writeQueue y load |
| `src/main.jsx` | Documentación del catch intencional |

**91 tests, build OK.**
