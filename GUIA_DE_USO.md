# 📱 GymRat Notes — Guía de Uso

**GymRat Notes** es una aplicación web progresiva (PWA) para registrar y hacer seguimiento de tus entrenamientos de gimnasio. Funciona 100% offline, se instala en tu móvil como una app nativa y almacena todos los datos localmente en tu dispositivo.

---

## 📋 Índice

1. [Instalación](#instalación)
2. [Navegación Principal](#navegación-principal)
3. [Entrenar (Pantalla Principal)](#entrenar-pantalla-principal)
4. [Entrenamiento Activo](#entrenamiento-activo)
5. [Rutinas](#rutinas)
6. [Historial](#historial)
7. [Perfil](#perfil)
8. [Exportar / Importar Datos](#exportar--importar-datos)
9. [Configuración](#configuración)
10. [Desarrollo Local](#desarrollo-local)

---

## Instalación

GymRat Notes es una PWA. Para instalarla:

1. Abre la app en tu navegador móvil (Chrome recomendado).
2. Aparecerá un banner superior con el botón **"Instalar"**.
3. Pulsa "Instalar" para añadirla a tu pantalla de inicio.
4. La app funcionará sin conexión a internet.

> También puedes usar "Añadir a pantalla de inicio" desde el menú del navegador.

---

## Navegación Principal

La app tiene una barra de navegación inferior con 4 secciones:

| Icono | Sección | Descripción |
|-------|---------|-------------|
| 🏋️ | **Ejercicios** | Catálogo de ejercicios + zona de entrenamiento activo |
| 📋 | **Rutinas** | Crear, editar y programar rutinas semanales |
| 📊 | **Historial** | Ver todos los entrenamientos pasados |
| 👤 | **Perfil** | Estadísticas, medidas corporales y configuración |

---

## Entrenar (Pantalla Principal)

La pantalla principal muestra el **catálogo de ejercicios** y es donde inicias y gestionas tu entrenamiento.

### Buscar ejercicios

- Usa la **barra de búsqueda** superior para filtrar por nombre.
- Usa los **botones de grupo muscular** (Pecho, Espalda, Hombros, Bíceps, Tríceps, Piernas, Core) para filtrar por categoría.
- Ambos filtros se combinan.

### Iniciar un entrenamiento

1. **Toca cualquier ejercicio** de la lista para iniciar automáticamente un entrenamiento con ese ejercicio.
2. Aparecerá una **barra superior** indicando que hay un entrenamiento activo con el número de ejercicios.
3. Sigue tocando ejercicios para añadirlos al entrenamiento.

### Registrar series

Al tocar un ejercicio que ya está en tu entrenamiento:

- Se expande mostrando el **editor de series inline**.
- Cada serie tiene campos según el tipo de ejercicio:
  - **Con peso:** kg + repeticiones
  - **Peso corporal:** +kg adicional (opcional) + repeticiones
  - **Por tiempo:** duración en segundos
- Pulsa **✓** para marcar una serie como completada.
- Pulsa **✕** para eliminar una serie.
- Pulsa **"+ Añadir serie"** para agregar más series.

### Referencia al rendimiento anterior

Si ya has hecho ese ejercicio antes, verás una sección **"Anterior:"** mostrando las series de tu última sesión con ese ejercicio. Esto te ayuda a saber qué peso/reps usar para progresar.

### Finalizar o cancelar

- **Finalizar entrenamiento:** Guarda el entrenamiento en el historial.
- **Cancelar entrenamiento:** Elimina el entrenamiento sin guardar.

Ambas acciones piden confirmación.

---

## Entrenamiento Activo

Si navegas a otra sección mientras tienes un entrenamiento activo, este **se mantiene**. Al volver, puedes continuar donde lo dejaste.

La barra superior con indicador pulsante te recuerda que hay un entrenamiento en curso.

### Desde la vista completa (`/active-workout`)

- Ves cada ejercicio en **tarjetas** con más detalle.
- Puedes añadir **notas** a cada ejercicio (campo colapsable).
- Botón **"+ Añadir ejercicio"** abre un selector con filtros.
- Botón **"Finalizar entrenamiento"** al final de la página.

---

## Rutinas

### Crear una rutina

1. Ve a la sección **Rutinas** (📋).
2. Pulsa **"+ Crear"**.
3. Escribe un **nombre** para la rutina.
4. Pulsa **"+ Añadir ejercicio"** para seleccionar ejercicios del catálogo.
5. Para cada ejercicio, define el **número de series objetivo**.
6. Usa las flechas **▲ ▼** para reordenar ejercicios.
7. Pulsa **"Guardar"**.

### Editar / Eliminar rutinas

- Toca **"Editar"** en cualquier rutina para modificarla.
- Toca **"Eliminar"** para borrarla (con confirmación).

### Programación semanal

Debajo de la lista de rutinas hay una sección de **Programación Semanal**:

- Asigna una rutina a cada día de la semana usando los selectores.
- Esto permite que la app te sugiera la rutina del día al entrenar.
- La programación es totalmente flexible y modificable.

---

## Historial

La sección **Historial** (📊) muestra todos tus entrenamientos finalizados, ordenados del más reciente al más antiguo.

### Vista general

Cada entrada muestra:
- **Fecha** del entrenamiento
- **Número de ejercicios** realizados
- **Grupos musculares** trabajados

### Vista detallada

Toca cualquier entrenamiento para expandirlo y ver:
- Cada ejercicio con sus series (peso × reps o duración)
- Marcas de series completadas (✓)
- Notas del ejercicio (si las hay)

### Eliminar

Dentro del detalle de un entrenamiento, pulsa **"Eliminar entrenamiento"** para borrarlo del historial.

---

## Perfil

La sección **Perfil** (👤) tiene tres pestañas:

### 📈 Estadísticas

- **Peso máximo por ejercicio:** Gráfica de línea que muestra la evolución del peso máximo. Selecciona el ejercicio con el dropdown.
- **Frecuencia de entrenamiento:** Gráfica de barras con el número de entrenamientos por semana (últimas 12 semanas).
- **Récords Personales (PRs):** Lista de los mejores pesos × reps por ejercicio, ordenados por volumen.

### 📏 Medidas Corporales

- Pulsa **"+ Añadir medición"** para registrar:
  - Peso corporal (kg)
  - Medidas: pecho, cintura, cadera, bíceps, muslo, gemelo (cm)
- Se muestra una **gráfica de evolución** del peso corporal.
- Historial de todas las mediciones con fecha.

### ⚙️ Configuración

- **Nombre:** Nombre de usuario (opcional).
- **Tema:** Claro / Oscuro / Sistema.
- **Idioma:** Español / English.
- **Datos:** Exportar e importar (ver sección siguiente).

---

## Exportar / Importar Datos

### Exportar

1. Ve a **Perfil > Configuración**.
2. Pulsa **"Exportar datos"**.
3. Se descargará un archivo JSON con todos tus datos (ejercicios, rutinas, entrenamientos, medidas, configuración).

### Importar (Fusionar)

- Pulsa **"Importar (fusionar)"**.
- Selecciona un archivo JSON de backup.
- Los datos se **combinan** con los existentes sin borrar nada.

### Importar (Reemplazar)

- Pulsa **"Importar (reemplazar)"**.
- Selecciona un archivo JSON.
- ⚠️ **Se borran todos los datos actuales** y se reemplazan por los del archivo.
- Requiere confirmación.

---

## Configuración

### Tema

- **Claro:** Fondo blanco.
- **Oscuro:** Fondo oscuro.
- **Sistema:** Sigue la preferencia de tu dispositivo (`prefers-color-scheme`).

### Idioma

- **Español:** Interfaz y nombres de ejercicios en español.
- **English:** Interfaz y nombres de ejercicios en inglés.

El cambio es instantáneo, sin recargar la app.

---

## Desarrollo Local

### Requisitos

- Node.js 18+
- npm

### Comandos

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview

# Ejecutar linter
npm run lint
```

### Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| React 19 | Framework UI |
| Vite 8 | Build tool |
| Tailwind CSS 4 | Estilos |
| Dexie.js | IndexedDB (almacenamiento local) |
| Recharts | Gráficas |
| i18next | Internacionalización (ES/EN) |
| react-router-dom | Navegación SPA |

### Estructura del proyecto

```
src/
├── App.jsx              # Rutas y providers principales
├── components/
│   ├── Layout.jsx       # Barra de navegación + estructura
│   └── ExerciseSelector.jsx  # Modal de selección de ejercicios
├── context/
│   ├── ThemeContext.jsx # Gestión de tema claro/oscuro
│   └── WorkoutContext.jsx # Estado del entrenamiento activo
├── db/
│   ├── database.js      # Esquema IndexedDB con Dexie
│   └── seed.js          # Datos iniciales (catálogo de ejercicios)
├── i18n/
│   ├── i18n.js          # Configuración de i18next
│   ├── es.json          # Traducciones en español
│   └── en.json          # Traducciones en inglés
└── pages/
    ├── HomePage.jsx         # Catálogo + entrenamiento inline
    ├── ActiveWorkoutPage.jsx # Vista completa del entrenamiento
    ├── HistoryPage.jsx      # Historial de entrenamientos
    ├── RoutinesPage.jsx     # Gestión de rutinas + programación
    └── ProfilePage.jsx      # Estadísticas, medidas y ajustes
```

---

## 💡 Tips de Uso

1. **Progresa con datos:** Antes de cada serie, revisa la sección "Anterior" para intentar superar tu rendimiento previo.
2. **Usa rutinas:** Crea rutinas para no perder tiempo eligiendo ejercicios cada día.
3. **Haz backups:** Exporta tus datos periódicamente para no perderlos si borras el navegador.
4. **Instala la PWA:** La experiencia es mucho mejor como app instalada (pantalla completa, acceso offline garantizado).
5. **Registra medidas:** Complementa tu tracking de ejercicios con medidas corporales para ver tu progreso real.
