# Auditoría de Observabilidad — GymRat Notes

**Fecha**: 2026-09-01  
**Versión**: `294ab7e`  
**Contexto**: PWA cliente sin servidor propio. Static hosting (GitHub Pages) + Supabase (managed).

---

## Modelo de observabilidad

Esta app **no tiene servidor propio**. Los conceptos de observabilidad server-side (request IDs, distributed tracing, health checks, readiness probes, connection pools, CPU/memory metrics, traffic dashboards) **no aplican directamente**.

La observabilidad se divide en:

| Capa | Quién la controla | Herramientas |
|------|-------------------|-------------|
| **Hosting** (GitHub Pages) | GitHub | GitHub Actions logs |
| **Backend** (Supabase) | Supabase Dashboard | Logs, métricas, alertas built-in |
| **Cliente** (navegador) | Nosotros | `logger.js` + buffer de errores |

---

## ¿Podemos responder a estas preguntas?

| Pregunta | Antes | Después | Cómo |
|----------|-------|---------|------|
| ¿Qué ha fallado? | ❌ Silencioso en prod | ✅ Buffer estructurado | `window.__gymratErrors` en consola |
| ¿Cuándo? | ❌ Sin timestamp | ✅ `timestamp` en cada entry | Campo `timestamp` en el buffer |
| ¿A cuántos usuarios afecta? | ❌ | ⚠️ Solo si integran Sentry | Requiere servicio externo |
| ¿Qué endpoint/servicio falla? | ❌ | ✅ Context con tabla | `sync:push:workouts`, `sync:pull:routines` |
| ¿Cuál es la latencia? | ❌ | ✅ `withTiming` en sync | Warning automático >500ms en dev |
| ¿Qué dependencia externa falla? | ❌ | ✅ Supabase errors con context | Error message + tabla afectada |
| ¿Falla la base de datos? | ❌ | ✅ IndexedDB errors con context | `workout:save`, `workout:load` |
| ¿Errores de autorización? | ❌ | ✅ Via Supabase error message | RLS violations llegan como error |
| ¿Aumento de tráfico? | N/A | N/A | Supabase Dashboard |
| ¿Memory/CPU pressure? | N/A | N/A | DevTools del navegador |

---

## Implementación

### Logger estructurado (`src/utils/logger.js`)

```js
// Cada error se almacena como:
{
  level: 'error',
  context: 'sync:push:workouts',   // identificador de la operación
  message: 'duplicate key value',  // mensaje del error (sin stack trace)
  timestamp: 1725187200000,        // cuándo ocurrió
  url: '/gymRatNotes/',            // en qué ruta estaba el usuario
  online: true,                    // si había conexión
}
```

**Buffer circular** de últimos 50 errores accesible desde consola:
```js
// En producción, el usuario puede hacer:
window.__gymratErrors
// → [{ level: 'error', context: 'sync:push:workouts', ... }]
```

### `withTiming` — métricas de latencia

```js
await withTiming('sync:push', () => pushAllTables());
// Si tarda >500ms en dev → console.warn("[perf:sync:push] 1234ms")
// Si falla → logError con duración incluida en el context
```

Aplicado a:
- `sync:push` — push de tablas dirty a Supabase
- `sync:pull` — pull de cambios desde Supabase

### Puntos de logging existentes

| Context | Archivo | Qué captura |
|---------|---------|-------------|
| `sync` | `App.jsx` | Error general de sync (interval, online, login) |
| `sync:push:<tabla>` | `sync.js` | Fallo de push por tabla |
| `sync:pull:<tabla>` | `sync.js` | Fallo de pull por tabla |
| `workout:save` | `useTodayWorkout.js` | Fallo de auto-save a IndexedDB |
| `workout:load` | `useTodayWorkout.js` | Fallo de carga del workout del día |

---

## Lo que NO se implementó (y por qué)

### Sentry / Error reporting externo
- **Por qué no**: Para una app de 1.99€ con <1000 usuarios iniciales, Sentry Free (5K events/mes) es viable pero añade una dependencia, SDK de ~30KB, y complejidad de configuración. El buffer en `window.__gymratErrors` es suficiente para la fase actual.
- **Cuándo implementar**: Cuando haya >100 usuarios activos o se reporte un bug que no se pueda reproducir.

### Custom analytics / business metrics
- **Por qué no**: Supabase Dashboard ya muestra requests por tabla, latencia, y usuarios activos. Duplicar eso en el cliente es redundante.
- **Cuándo implementar**: Si se necesitan métricas de negocio (workouts completados/semana, retención) que Supabase no da.

### Correlation IDs / Request IDs
- **Por qué no**: No hay distributed tracing. Las operaciones son cliente→Supabase directo. Supabase asigna sus propios request IDs internamente.

### Health checks / Readiness probes
- **Por qué no**: No hay servidor. GitHub Pages está up o no. Supabase tiene su propio status page.

### Alerting
- **Por qué no**: Sin server no hay dónde ejecutar alertas. Supabase Dashboard tiene alertas configurables para la BD.
- **Alternativa futura**: GitHub Actions cron que haga un health check al endpoint de Supabase.

---

## Diagnóstico en producción — Guía

### "Un usuario reporta que la app no sincroniza"

1. Pedir al usuario que abra DevTools → Console → escriba `window.__gymratErrors`
2. Buscar entries con `context: 'sync:*'`
3. El `message` indicará si es error de red, RLS, o Supabase down
4. El `online` indicará si estaba offline
5. El `timestamp` indicará cuándo empezó el problema

### "Un usuario reporta que perdió datos"

1. Verificar en Supabase Dashboard si los datos están en la BD remota
2. Si están: el problema es el pull (revisar `sync:pull:*` errors)
3. Si no están: el problema es el push (revisar `sync:push:*` errors)
4. Si el buffer está vacío: el sync nunca se ejecutó (usuario sin login)

### "La app va lenta al abrir"

1. En dev: buscar warnings `[perf:*]` en consola (>500ms)
2. El context indicará si es `sync:push` (subida lenta) o `sync:pull` (descarga lenta)
3. Si no hay warnings de sync: el problema es IndexedDB local (volumen de datos)

---

## Correcciones aplicadas

| Cambio | Archivo |
|--------|---------|
| Logger estructurado con buffer circular | `src/utils/logger.js` |
| `withTiming` para medir latencia de operaciones async | `src/utils/logger.js` |
| Timing aplicado a sync push/pull | `src/db/sync.js` |
| `window.__gymratErrors` accesible en producción | `src/utils/logger.js` |

**116 tests, build OK.**
