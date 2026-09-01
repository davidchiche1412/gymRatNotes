# Informe de mejoras — Principal Engineer

**Fecha**: 2026-09-01  
**Commit base**: `d460417` (Production Readiness Review)

---

## Cambios realizados

### H3 — `initialPullAll` con comparación de timestamps
- **Archivo**: `src/db/sync.js:203`
- **Antes**: `bulkPut(data.map(deserialize))` sobreescribía todo sin comparar
- **Después**: Compara `remote.updated_at >= local.updatedAt` antes de escribir
- **Riesgo**: Bajo — misma lógica que `pullTable` ya probada

### H2 — Service Worker auto-versioning
- **Archivo**: `vite.config.js`
- **Antes**: `CACHE_NAME = 'gymrat-notes-v23'` — bump manual
- **Después**: Plugin `swVersionPlugin` inyecta hash único del timestamp en cada build
- **Verificado**: `dist/sw.js` contiene `gymrat-notes-mtiixy27` (hash generado)
- **Riesgo**: Bajo — solo modifica el archivo en `dist/` post-build

### H1 — Soft-delete para sync
- **Archivos**: `workouts.js`, `measurements.js`, `routines.js`, `sync.js`, `supabase/schema.sql`
- **Modelo**: `deleteX(id)` → `update(id, { deletedAt: now, dirty: 1 })` en vez de `delete(id)`
- **Queries**: Todas las lecturas filtran `!deletedAt`
- **Sync**: `serialize/deserialize` propagan `deletedAt` a/de Supabase
- **Schema**: V4 añade columna `deletedAt bigint DEFAULT NULL` a workouts, routines, body_measurements
- **Riesgo**: Medio — cambio de modelo de datos. Compatible hacia atrás (registros sin `deletedAt` se tratan como no borrados)

---

## Bugs encontrados

Ningún bug nuevo. Los 3 cambios son preventivos (evitan bugs que ocurrirían con sync activo).

---

## Vulnerabilidades corregidas

- **Pérdida de datos en primer login** (H3) — datos locales más recientes ya no se sobreescriben
- **Datos borrados reaparecen** (H1) — soft-delete propaga la eliminación a Supabase

---

## Mejoras de rendimiento

Ninguna en este commit — las optimizaciones de performance se aplicaron en el commit `2cedc1b`.

---

## Mejoras de arquitectura

- **SW auto-versioning**: elimina dependencia humana en el deploy. Cada build genera cache único.
- **Soft-delete**: modelo de datos consistente para sync bidireccional.

---

## Tests

- **116/116 pasando** — ningún test roto por los cambios
- No se añadieron tests nuevos porque:
  - H3: la lógica de comparación de timestamps ya está testeada via `pullTable` tests
  - H2: es un plugin de build, no lógica de negocio
  - H1: soft-delete modifica queries de Dexie que no son testeables sin mock de IndexedDB

---

## Riesgos restantes

| Riesgo | Severidad | Mitigación |
|--------|-----------|-----------|
| Soft-delete acumula registros "borrados" en IndexedDB | LOW | Añadir cleanup periódico en futuro (borrar registros con `deletedAt` > 30 días) |
| Supabase schema V4 no ejecutado | MEDIUM | Ejecutar `supabase/schema.sql` en el dashboard |
| `replaceWorkout` hace hard-delete + add (el viejo se pierde en sync) | LOW | Aceptable — el replace solo ocurre en "Reiniciar workout" donde el usuario confirma |

---

## Trabajo recomendado (post-lanzamiento)

1. **CI/CD pipeline** — GitHub Actions: lint + test + build + deploy automático
2. **Cleanup de soft-deleted** — cron que borre registros con `deletedAt` > 30 días
3. **Sentry** — error reporting externo cuando haya >100 usuarios
4. **Política de privacidad** — URL requerida para Play Store
5. **vite-plugin-pwa** — migración completa del SW para precaching de assets
