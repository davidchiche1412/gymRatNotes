# GymRat Notes — Product Requirements Document (PRD)

**Versión:** 1.0  
**Fecha:** 29 de marzo de 2026  
**Tipo de aplicación:** PWA (Progressive Web App)  
**Almacenamiento:** Local (IndexedDB)

---

## 1. Visión del Producto

GymRat Notes es una aplicación web progresiva (PWA) para el registro y seguimiento de entrenamientos de gimnasio. Inspirada en FitNotes, busca ofrecer una experiencia fluida, offline-first y sin dependencia de servidores, almacenando toda la información en el dispositivo del usuario.

---

## 2. Stack Técnico

| Componente       | Tecnología         |
| ---------------- | ------------------ |
| Framework        | React              |
| Lenguaje         | JavaScript (ES6+)  |
| Estilos          | Tailwind CSS       |
| Almacenamiento   | IndexedDB (Dexie.js) |
| Tipo de app      | PWA (Service Worker + Manifest) |
| Gráficos         | Chart.js o Recharts |
| i18n             | i18next            |
| Build tool       | Vite               |

---

## 3. Funcionalidades Principales

### 3.1 Gestión de Ejercicios

#### Tipos de ejercicio soportados
- **Con peso:** barra, mancuernas, máquinas, kettlebell (se registra peso en KG + repeticiones).
- **Peso corporal:** dominadas, fondos, flexiones, etc. (se registran repeticiones, opcionalmente peso adicional).
- **Por tiempo:** plancha, isométricos, etc. (se registra duración en segundos/minutos).

#### Catálogo de ejercicios
- La app incluirá un **catálogo predefinido** con los ejercicios básicos de gimnasio, organizados por:
  - **Grupo muscular:** Pecho, Espalda, Hombros, Bíceps, Tríceps, Piernas (cuádriceps, isquiotibiales, glúteos, gemelos), Core/Abdominales.
  - **Tipo de movimiento:** Empuje (Push), Tirón (Pull), Piernas (Legs), Core.
- Cada ejercicio tendrá asignados ambos atributos (grupo muscular + tipo de movimiento).
- El usuario podrá **añadir ejercicios personalizados** especificando nombre, tipo de ejercicio (peso/corporal/tiempo), grupo muscular y tipo de movimiento.
- El usuario podrá **editar y eliminar** ejercicios personalizados.

#### Filtros
- Filtrar ejercicios por **grupo muscular**.
- Filtrar ejercicios por **tipo de movimiento**.
- Ambos filtros pueden combinarse.
- Barra de **búsqueda por nombre**.

---

### 3.2 Registro de Entrenamientos

#### Flujo de entrenamiento
1. El usuario inicia un nuevo entrenamiento (opcionalmente desde una rutina).
2. Añade ejercicios **sobre la marcha** — búsqueda rápida, filtros o selección desde rutina.
3. Por cada ejercicio, registra **series** con los datos correspondientes según el tipo:
   - **Con peso:** peso (KG) + repeticiones.
   - **Peso corporal:** repeticiones (+ peso adicional opcional en KG).
   - **Por tiempo:** duración (segundos o minutos).
4. Puede añadir/quitar series libremente.
5. Puede añadir **notas opcionales** a cada ejercicio (texto libre).
6. Finaliza el entrenamiento cuando quiera.

#### Historial durante el entrenamiento
- Al seleccionar un ejercicio, se muestra el **rendimiento anterior** (última sesión con ese ejercicio): series, peso, repeticiones realizadas.
- Esto permite al usuario saber qué hizo la última vez y progresar.

#### Sin temporizador
- No se incluye temporizador de descanso entre series.

---

### 3.3 Rutinas

#### Creación y gestión
- El usuario puede crear **rutinas** con un nombre y una lista de ejercicios.
- Cada ejercicio dentro de la rutina puede tener un número de series objetivo predefinido.
- Las rutinas son **editables**: añadir, quitar o reordenar ejercicios en cualquier momento.
- Las rutinas pueden ser **eliminadas**.

#### Programación semanal
- El usuario puede asignar rutinas a **días de la semana** (Lunes = Push, Martes = Pull, etc.).
- La programación es completamente **personalizable y modificable**.
- Al iniciar un entrenamiento, la app puede **sugerir** la rutina del día según la programación, pero no obligar.

#### Flexibilidad
- Al entrenar con una rutina, el usuario puede **añadir ejercicios extra** o **saltar ejercicios** sin restricciones.

---

### 3.4 Historial de Entrenamientos

- Lista cronológica de todos los entrenamientos realizados.
- Cada entrada muestra: fecha, ejercicios realizados, series/reps/peso.
- Se puede acceder al detalle completo de cualquier entrenamiento pasado.
- Se pueden **eliminar** entrenamientos del historial.

---

### 3.5 Progreso y Estadísticas

#### Gráficos
- **Peso máximo por ejercicio a lo largo del tiempo:** gráfica de línea que muestre la evolución del peso máximo levantado en cada ejercicio.
- **Frecuencia de entrenamiento:** gráfica que muestre cuántos entrenamientos se realizaron por semana/mes.
- **PRs (Récords Personales):** listado de los récords por ejercicio (peso máximo × repeticiones).

#### Medidas corporales (en Perfil)
- El usuario puede registrar periódicamente:
  - Peso corporal (KG).
  - Medidas: pecho, cintura, cadera, bíceps, muslo, gemelo (cm).
- Historial de medidas con fecha.
- Gráfica de evolución del peso corporal.

---

### 3.6 Perfil de Usuario

- Nombre (opcional).
- Unidad de peso: KG (por defecto, única unidad en v1).
- Medidas corporales (ver 3.5).
- Configuración de tema (claro/oscuro).
- Configuración de idioma.

---

## 4. Datos y Almacenamiento

### 4.1 Almacenamiento Local
- Toda la información se almacena en **IndexedDB** mediante Dexie.js.
- La app funciona 100% **offline** gracias al Service Worker.
- No hay backend ni servidor en la v1.

### 4.2 Exportar / Importar (Backup)
- El usuario puede **exportar todos sus datos** a un archivo **JSON**.
- El mismo archivo JSON sirve como **backup**.
- El usuario puede **importar** un archivo JSON para restaurar sus datos.
- Al importar, se preguntará si desea **reemplazar** o **fusionar** con los datos existentes.

### 4.3 Sincronización Cloud (Futuro)
- Se contempla para versiones futuras, pero **no se implementa en v1**.
- La estructura de datos se diseñará para facilitar la migración futura a un sistema con sincronización.

---

## 5. PWA y Experiencia de Usuario

### 5.1 PWA
- **Manifest.json** con nombre, iconos y colores de la app.
- **Service Worker** para cache y funcionamiento offline completo.
- Instalable en móvil como aplicación nativa (Add to Home Screen).
- Diseño **mobile-first** (el uso principal será en el móvil).

### 5.2 Tema
- **Modo claro y modo oscuro.**
- El usuario puede cambiar entre ambos desde la configuración del perfil.
- Por defecto, se respeta la preferencia del sistema operativo (`prefers-color-scheme`).

### 5.3 Idiomas
- **Multiidioma** desde el inicio.
- Idiomas iniciales: **Español** e **Inglés**.
- Se usará **i18next** para gestionar traducciones.
- El idioma se puede cambiar desde la configuración.

### 5.4 Navegación
- Navegación principal mediante **barra inferior (bottom nav)** con las secciones:
  1. **Entrenar** — Iniciar/continuar entrenamiento.
  2. **Historial** — Ver entrenamientos pasados.
  3. **Rutinas** — Gestionar rutinas y programación.
  4. **Ejercicios** — Catálogo y gestión de ejercicios.
  5. **Perfil** — Configuración, medidas, estadísticas, export/import.

### 5.5 Sin notificaciones
- No se implementan notificaciones ni recordatorios.

---

## 6. Catálogo de Ejercicios por Defecto

### Pecho (Push)
| Ejercicio                    | Tipo     |
| ---------------------------- | -------- |
| Press de banca               | Peso     |
| Press de banca inclinado     | Peso     |
| Press de banca declinado     | Peso     |
| Press con mancuernas         | Peso     |
| Aperturas con mancuernas     | Peso     |
| Aperturas en polea           | Peso     |
| Fondos en paralelas          | Corporal |
| Flexiones                    | Corporal |

### Espalda (Pull)
| Ejercicio                    | Tipo     |
| ---------------------------- | -------- |
| Dominadas                    | Corporal |
| Jalón al pecho               | Peso     |
| Remo con barra               | Peso     |
| Remo con mancuerna           | Peso     |
| Remo en polea baja           | Peso     |
| Pull-over                    | Peso     |
| Peso muerto                  | Peso     |

### Hombros (Push)
| Ejercicio                    | Tipo     |
| ---------------------------- | -------- |
| Press militar                | Peso     |
| Press con mancuernas (hombro)| Peso     |
| Elevaciones laterales        | Peso     |
| Elevaciones frontales        | Peso     |
| Pájaros (elevaciones posteriores) | Peso |
| Face pull                    | Peso     |

### Bíceps (Pull)
| Ejercicio                    | Tipo     |
| ---------------------------- | -------- |
| Curl con barra               | Peso     |
| Curl con mancuernas          | Peso     |
| Curl martillo                | Peso     |
| Curl en polea                | Peso     |
| Curl concentrado             | Peso     |

### Tríceps (Push)
| Ejercicio                    | Tipo     |
| ---------------------------- | -------- |
| Press francés                | Peso     |
| Extensión de tríceps en polea | Peso    |
| Fondos en banco              | Corporal |
| Patada de tríceps            | Peso     |

### Piernas (Legs)
| Ejercicio                    | Tipo     |
| ---------------------------- | -------- |
| Sentadilla                   | Peso     |
| Prensa de piernas            | Peso     |
| Extensión de cuádriceps      | Peso     |
| Curl femoral                 | Peso     |
| Zancadas / Lunges            | Peso     |
| Hip thrust                   | Peso     |
| Elevación de gemelos         | Peso     |
| Sentadilla búlgara           | Peso     |
| Peso muerto rumano           | Peso     |

### Core
| Ejercicio                    | Tipo     |
| ---------------------------- | -------- |
| Crunch                       | Corporal |
| Crunch en polea              | Peso     |
| Plancha                      | Tiempo   |
| Plancha lateral              | Tiempo   |
| Elevación de piernas colgado | Corporal |
| Russian twist                | Corporal |
| Ab wheel / Rueda abdominal   | Corporal |

---

## 7. Modelo de Datos (Esquema IndexedDB)

```
exercises
├── id: string (uuid)
├── name: string
├── nameEN: string
├── type: "weight" | "bodyweight" | "timed"
├── muscleGroup: "chest" | "back" | "shoulders" | "biceps" | "triceps" | "legs" | "core"
├── movementType: "push" | "pull" | "legs" | "core"
├── isCustom: boolean
└── createdAt: timestamp

routines
├── id: string (uuid)
├── name: string
├── exercises: [{ exerciseId, targetSets }]
└── updatedAt: timestamp

weeklySchedule
├── id: string (uuid)
├── dayOfWeek: 0-6 (lunes-domingo)
└── routineId: string | null

workouts
├── id: string (uuid)
├── date: timestamp
├── routineId: string | null (si se usó una rutina)
├── exercises: [{
│     exerciseId: string,
│     notes: string | null,
│     sets: [{
│       weight: number | null,
│       reps: number | null,
│       duration: number | null,
│       completed: boolean
│     }]
│   }]
└── finishedAt: timestamp | null

bodyMeasurements
├── id: string (uuid)
├── date: timestamp
├── weight: number | null (kg)
├── chest: number | null (cm)
├── waist: number | null (cm)
├── hips: number | null (cm)
├── biceps: number | null (cm)
├── thigh: number | null (cm)
└── calf: number | null (cm)

userSettings
├── id: "settings" (singleton)
├── name: string
├── theme: "light" | "dark" | "system"
├── language: "es" | "en"
└── updatedAt: timestamp
```

---

## 8. Pantallas de la Aplicación

### 8.1 Entrenar (Home)
- Botón principal: **"Iniciar Entrenamiento"**.
- Si hay programación para hoy, sugerir la rutina del día.
- Si hay un entrenamiento en curso, mostrar opción de **continuar**.

### 8.2 Entrenamiento Activo
- Header con nombre de la rutina (o "Entrenamiento libre").
- Lista de ejercicios añadidos.
- Por cada ejercicio:
  - Filas de series con inputs de peso/reps/duración según tipo.
  - Referencia visual al rendimiento anterior.
  - Botón para añadir serie.
  - Campo de notas colapsable.
- Botón flotante para **añadir ejercicio** (abre selector con filtros).
- Botón de **finalizar entrenamiento**.

### 8.3 Historial
- Lista de entrenamientos ordenados por fecha (más reciente primero).
- Cada card muestra: fecha, nº de ejercicios, grupos musculares trabajados.
- Al tocar, se abre el **detalle completo** del entrenamiento.

### 8.4 Rutinas
- Lista de rutinas creadas.
- Botón para **crear nueva rutina**.
- Al tocar una rutina: editar nombre, ejercicios, orden.
- Sección de **programación semanal**: asignar rutinas a días.

### 8.5 Ejercicios
- Catálogo completo (predefinidos + personalizados).
- Filtros: grupo muscular, tipo de movimiento.
- Barra de búsqueda.
- Botón para **añadir ejercicio personalizado**.
- Al tocar un ejercicio: ver detalle, historial y gráfica de progreso.

### 8.6 Perfil
- Nombre de usuario.
- **Estadísticas:**
  - Gráfica de peso máximo por ejercicio.
  - Gráfica de frecuencia de entrenamiento.
  - Lista de PRs.
- **Medidas corporales:**
  - Registrar nueva medición.
  - Historial de mediciones.
  - Gráfica de evolución de peso corporal.
- **Configuración:**
  - Tema: Claro / Oscuro / Sistema.
  - Idioma: Español / English.
- **Datos:**
  - Exportar datos (JSON).
  - Importar datos (JSON).

---

## 9. Requisitos No Funcionales

| Requisito              | Detalle                                                    |
| ---------------------- | ---------------------------------------------------------- |
| Rendimiento            | Tiempo de carga < 2s en 3G. Interacciones < 100ms.        |
| Offline                | 100% funcional sin conexión a internet.                    |
| Responsividad          | Mobile-first. Usable en tablet y desktop.                  |
| Accesibilidad          | Contraste adecuado, inputs accesibles, navegación por teclado. |
| Datos                  | No se pierden datos al cerrar la app o recargar la página. |
| Instalabilidad         | Cumplir criterios PWA de Lighthouse (score > 90).          |

---

## 10. Fuera de Alcance (v1)

- Sincronización cloud / cuentas de usuario.
- Ejercicios de cardio (distancia/calorías).
- Temporizador de descanso.
- Notificaciones / recordatorios.
- Gamificación (rachas, logros, badges).
- Resumen post-entrenamiento.
- Vista de calendario.
- Compartir entrenamientos.
- Integración con wearables.

---

## 11. Prioridades de Desarrollo

### Fase 1 — MVP Core
1. Estructura del proyecto (React + Vite + Tailwind + PWA).
2. Base de datos local (IndexedDB/Dexie).
3. Catálogo de ejercicios (predefinidos + CRUD personalizados).
4. Registro de entrenamiento (flujo completo).
5. Historial de entrenamientos.

### Fase 2 — Rutinas y Progreso
6. Creación y gestión de rutinas.
7. Programación semanal.
8. Gráficas de progreso (peso máximo, frecuencia).
9. PRs (récords personales).

### Fase 3 — Perfil y Pulido
10. Perfil con medidas corporales.
11. Tema claro/oscuro.
12. Multiidioma (ES/EN).
13. Export/Import de datos.
14. Optimización PWA y Lighthouse.
