# Auditoría de Seguridad — GymRat Notes

**Fecha**: 2026-09-01  
**Versión auditada**: `a73b0a2`  
**Metodología**: OWASP Top 10 2021 + revisión manual de código  
**Alcance**: todo `src/`, `supabase/`, `public/`, configuración, dependencias

---

## Resumen ejecutivo

Se identificaron **6 vulnerabilidades** y **3 debilidades de configuración**. Se corrigieron todas las vulnerabilidades explotables. No se encontraron: XSS vía `dangerouslySetInnerHTML`, command injection, CSRF (Supabase usa tokens Bearer), CORS misconfiguration, JWT exposure, ni localStorage/sessionStorage con datos sensibles.

---

## Hallazgos y correcciones aplicadas

### SEC-01 — Shared tables sin control de ownership (OWASP A01)
| Campo | Detalle |
|---|---|
| **Severidad** | HIGH |
| **Archivos** | `supabase/schema.sql:127-143`, `src/db/queries/sharedRoutines.js:5-11` |
| **Problema** | Las tablas `shared_routines` y `shared_schedules` tenían UPDATE policy `auth.role() = 'authenticated'` sin verificar ownership. Cualquier usuario autenticado podía sobreescribir la rutina compartida de otro usuario con datos maliciosos. |
| **Explotación** | Un atacante registra una cuenta, obtiene el UUID de una rutina compartida popular (visible en la UI), y hace `upsert` con datos manipulados. Otros usuarios que importen esa rutina reciben datos corruptos. |
| **Corrección** | Eliminada la policy de UPDATE → tablas inmutables (solo INSERT). `publishRoutine` y `publishSchedule` ahora usan `insert` en vez de `upsert`, ignorando conflictos de duplicados. |
| **Tests** | Verificado que la app funciona correctamente con insert-only. |

### SEC-02 — Sanitizador bypassable con regex denylist (OWASP A03)
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivo** | `src/utils/sanitize.js:1-6` |
| **Problema** | El regex `/<\/?script[^>]*>\|javascript:\|on\w+\s*=/gi` solo bloqueaba `<script>`, `javascript:` y `onXxx=`. Bypassable con `<img>`, `<svg>`, `<iframe>`, tabs en event handlers, o tags recursivos. |
| **Explotación** | `<svg onload=alert(document.cookie)>` pasaba el filtro. Aunque React escapa JSX, el dato se almacena en Supabase y podría ser consumido por clientes futuros sin escapado. |
| **Corrección** | Reemplazado con strip-all-tags: `value.replace(/<[^>]*>/g, '')`. Elimina cualquier tag HTML. |
| **Tests** | 5 tests: `<script>`, `<img onerror>`, `<svg onload>`, `<iframe>`, tags anidados. |

### SEC-03 — Backup import sin sanitización de rows (OWASP A08)
| Campo | Detalle |
|---|---|
| **Severidad** | HIGH |
| **Archivo** | `src/db/queries/settings.js:36-65` |
| **Problema** | `importAppData` volcaba los arrays del JSON de backup directamente a IndexedDB vía `bulkPut` sin validar campos ni sanitizar strings. Un backup malicioso podía inyectar payloads XSS en nombres de rutinas/ejercicios, o incluir keys como `__proto__`. |
| **Explotación** | El atacante genera un JSON con `{"routines": [{"id":"x","name":"<img onerror=alert(1)>","exercises":[]}]}` y lo comparte como "backup". La víctima lo importa → payload almacenado en BD. |
| **Corrección** | Función `sanitizeRow` aplicada a cada row antes de `bulkPut`: valida que tenga `id`, strip HTML de strings, elimina `__proto__`/`constructor`, cap de 500 chars por string. |
| **Tests** | Cubierto indirectamente por tests de sanitize. |

### SEC-04 — `deserializeBodyMeasurement` spread de datos remotos (OWASP A08)
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivo** | `src/db/sync.js:59-61` |
| **Problema** | `...row.data` hacía spread de JSONB remoto sin filtrar. Un payload con `"date": 0` dentro de `data` sobreescribía el `date` real de la medida. Keys como `dirty`, `id`, `createdAt` también podían ser inyectados. |
| **Explotación** | El usuario modifica su propio campo `data` en Supabase (tiene permiso RLS) para incluir `{"date":0,"dirty":1,"__proto__":{"polluted":true}}`. En el siguiente pull, la medida se corrompe localmente. |
| **Corrección** | Allowlist: solo se copian keys que no colisionen con campos internos (`id`, `date`, `dirty`, timestamps) y que tengan valor numérico. |
| **Tests** | Lógica interna verificada. |

### SEC-05 — User enumeration via login error messages (OWASP A07)
| Campo | Detalle |
|---|---|
| **Severidad** | MEDIUM |
| **Archivo** | `src/pages/auth/LoginPage.jsx:26` |
| **Problema** | `setError(err.message)` mostraba mensajes raw de Supabase como "User not found" o "Email not confirmed", permitiendo enumerar emails registrados. |
| **Explotación** | El atacante prueba emails en el formulario de login. Si el mensaje cambia entre "User not found" y "Invalid login credentials", sabe si el email está registrado. |
| **Corrección** | Mensaje genérico `t('auth.invalidCredentials')` para errores de login. Registro mantiene el mensaje original (necesario para feedback de confirmación de email). |
| **Tests** | Verificación visual. |

### SEC-06 — `serializeBodyMeasurement` incluye `dirty` en payload remoto
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `src/db/sync.js:32-35` |
| **Problema** | El campo interno `dirty` se subía a Supabase como parte de `data`. No es explotable pero es data leak innecesario. |
| **Corrección** | Excluido `dirty` y `date` del spread con destructuring explícito. |

---

## Hallazgos adicionales de configuración

### SEC-07 — Dependencias con vulnerabilidades conocidas
| Campo | Detalle |
|---|---|
| **Severidad** | HIGH (vite dev server) / MEDIUM (uuid) |
| **Problema** | `vite@8.0.x` tenía 7 vulnerabilidades HIGH (path traversal, WebSocket file read). `uuid@13.0.0` tenía 1 MEDIUM (buffer bounds check). Solo afectan al dev server, no a producción. |
| **Corrección** | `npm audit fix` ejecutado → 0 vulnerabilidades. |

### SEC-08 — `console.error` en producción puede leakear stack traces
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Archivo** | `src/App.jsx:58,61,68,78` |
| **Problema** | Los sync errors se envían a `console.error`. En producción, si un usuario abre DevTools, podría ver URLs de Supabase, IDs de usuario, o detalles de errores de red. |
| **Recomendación** | Reemplazar con logger silencioso en producción o un servicio de error reporting. No corregido — bajo impacto. |

### SEC-09 — Sin Content Security Policy
| Campo | Detalle |
|---|---|
| **Severidad** | LOW |
| **Problema** | No hay CSP header configurado. En GitHub Pages no se puede configurar vía servidor, pero se puede añadir como `<meta>` tag en `index.html`. |
| **Recomendación** | Añadir `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co;">` |
| **Impacto** | Bajo — React ya escapa JSX y no se usa `dangerouslySetInnerHTML`. |

---

## Vectores verificados sin hallazgos

| Vector | Estado |
|---|---|
| XSS vía `dangerouslySetInnerHTML` | ✅ No se usa en ningún archivo |
| Command injection | ✅ No hay ejecución de shell |
| SQL injection (Supabase) | ✅ Usa SDK parametrizado, no strings SQL |
| CSRF | ✅ Supabase usa Bearer tokens, no cookies |
| CORS misconfiguration | ✅ Configuración estándar de Supabase SDK |
| JWT exposure | ✅ Manejado internamente por Supabase SDK |
| localStorage/sessionStorage con datos sensibles | ✅ No se usan (Supabase SDK usa su propio storage) |
| Service Worker cache poisoning | ✅ Network-first strategy correcta |
| `.env` en git | ✅ Correctamente gitignoreado |
| Path traversal | ✅ No hay file system access en la app |
| SSRF | ✅ No hay server-side requests |

---

## Cambios aplicados en este commit

| Archivo | Cambio |
|---|---|
| `src/utils/sanitize.js` | Strip-all-tags en vez de regex denylist |
| `src/utils/sanitize.test.js` | 6 tests actualizados para el nuevo enfoque |
| `src/pages/auth/LoginPage.jsx` | Mensaje genérico en login errors |
| `src/db/sync.js` | Allowlist en `deserializeBodyMeasurement`, excluir `dirty` en serialize |
| `src/db/queries/settings.js` | `sanitizeRow` en backup import |
| `src/db/queries/sharedRoutines.js` | `insert` en vez de `upsert` para tablas inmutables |
| `supabase/schema.sql` | Eliminada UPDATE policy de shared tables |
| `src/i18n/es.json` + `en.json` | Traducción `auth.invalidCredentials` |
| `package-lock.json` | `npm audit fix` → 0 vulnerabilidades |

**91 tests pasando, build OK.**
