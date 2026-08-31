# Publicar GymRat Notes en Google Play (1.99€)

## 1. Cuenta de Google Play Developer

- **Coste**: 25$ (pago único)
- Registro en [play.google.com/console](https://play.google.com/console)
- Necesitas cuenta de Google (personal o empresa)

## 2. Empaquetar la PWA como app Android

La PWA ya funciona. Solo hay que envolverla en una TWA (Trusted Web Activity).

| Opción | Coste | Esfuerzo |
|--------|-------|----------|
| **PWABuilder** (pwabuilder.com) | Gratis | Mínimo — sube la URL y genera el AAB |
| **Bubblewrap** (CLI de Google) | Gratis | Bajo — más control sobre la config |
| **Capacitor** (Ionic) | Gratis | Medio — si necesitas APIs nativas |

**Recomendación**: PWABuilder para empezar. Si necesitas más control, Bubblewrap.

## 3. Requisitos técnicos de la PWA

### Ya cumplidos ✅

- `manifest.webmanifest` configurado
- Service Worker (`sw.js`) registrado
- HTTPS (GitHub Pages)
- Funcionalidad offline

### Por verificar / preparar ⚠️

- [ ] **Iconos**: 512x512 px (PNG) + maskable icon (con safe zone)
- [ ] **`display: standalone`** en el manifest
- [ ] **`start_url`** correcto en el manifest
- [ ] **Digital Asset Links**: archivo `/.well-known/assetlinks.json` en el dominio para que la TWA funcione sin barra del navegador
- [ ] **`theme_color`** y **`background_color`** en el manifest

## 4. Configurar app de pago

- Configurar **perfil de pagos** en Play Console (cuenta bancaria + datos fiscales)
- Google se queda con el **15%** (programa tarifa reducida para <1M$/año) o **30%**
- Ingreso neto por venta: ~1.69€ (15%) o ~1.39€ (30%)
- ⚠️ La app se marca como de pago **antes de publicar** — no se puede cambiar de gratis a pago después

## 5. Contenido obligatorio para la ficha

- [ ] **Icono alta resolución**: 512x512 px
- [ ] **Gráfico de funciones** (feature graphic): 1024x500 px
- [ ] **Capturas de pantalla**: mínimo 2 para teléfono (1080x1920 o similar)
- [ ] **Descripción corta**: máx. 80 caracteres
- [ ] **Descripción larga**: máx. 4000 caracteres
- [ ] **Clasificación de contenido**: cuestionario IARC (gratis, ~5 min)
- [ ] **Política de privacidad**: URL obligatoria

## 6. Política de privacidad

Obligatoria para apps con cuentas de usuario. Debe incluir:

- Qué datos se recogen (email, datos de entrenamiento, medidas corporales)
- Cómo se almacenan (Supabase, cifrado en tránsito)
- Si se comparten con terceros (no)
- Cómo el usuario puede borrar sus datos
- Contacto del desarrollador

Se puede alojar como una página estática en GitHub Pages (ej: `/privacy`).

## 7. Consideración: acceso web vs app de pago

La PWA es accesible por URL. Si se vende a 1.99€ pero cualquiera la usa gratis por web, opciones:

- **A) Vender la comodidad**: la web sigue gratis, la app de Play es la versión "nativa". Algunos desarrolladores lo hacen.
- **B) Limitar sin cuenta de pago**: usar Supabase auth + verificación de compra de Play para desbloquear features premium.
- **C) Quitar la PWA pública**: desplegar solo como app Android.

## 8. Pasos en orden

1. Crear cuenta Google Play Developer (25$)
2. Generar iconos (512x512 + maskable) y capturas de pantalla
3. Escribir política de privacidad y alojarla en GitHub Pages
4. Verificar manifest (display, start_url, icons, theme_color)
5. Configurar Digital Asset Links (`assetlinks.json`)
6. Empaquetar con PWABuilder o Bubblewrap → genera AAB firmado
7. Subir AAB a Play Console
8. Rellenar ficha: descripciones, capturas, icono, feature graphic
9. Completar cuestionario IARC
10. Configurar precio 1.99€ + perfil de pagos
11. Enviar a revisión (~1-3 días la primera vez)

## 9. Costes totales

| Concepto | Coste |
|----------|-------|
| Cuenta Google Play | 25$ (una vez) |
| Hosting PWA (GitHub Pages) | Gratis |
| Supabase (plan Free) | Gratis (hasta 50K MAU) |
| Empaquetado (PWABuilder/Bubblewrap) | Gratis |
| **Total inicial** | **~25$** |
