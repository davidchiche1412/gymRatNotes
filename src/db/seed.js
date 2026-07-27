import { v4 as uuidv4 } from 'uuid';
import { db } from './database';

const defaultExercises = [
  // Pecho (Push)
  { name: 'Press de banca', nameEN: 'Bench Press', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Press de banca inclinado', nameEN: 'Incline Bench Press', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Press de banca declinado', nameEN: 'Decline Bench Press', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Press con mancuernas', nameEN: 'Dumbbell Press', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Aperturas con mancuernas', nameEN: 'Dumbbell Flyes', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Aperturas en polea', nameEN: 'Cable Flyes', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Fondos en paralelas', nameEN: 'Parallel Bar Dips', type: 'bodyweight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Flexiones', nameEN: 'Push-ups', type: 'bodyweight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Flexiones con déficit', nameEN: 'Deficit Push-ups', type: 'bodyweight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Flexiones declinadas', nameEN: 'Decline Push-ups', type: 'bodyweight', muscleGroup: 'chest', movementType: 'push' },

  // Espalda (Pull)
  { name: 'Dominadas', nameEN: 'Pull-ups', type: 'bodyweight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Jalón al pecho', nameEN: 'Lat Pulldown', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo con barra', nameEN: 'Barbell Row', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo con mancuerna', nameEN: 'Dumbbell Row', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo en polea baja', nameEN: 'Seated Cable Row', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo apoyado en pecho', nameEN: 'Chest-Supported Row', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo invertido', nameEN: 'Inverted Row', type: 'bodyweight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Pull-over', nameEN: 'Pull-over', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Peso muerto', nameEN: 'Deadlift', type: 'weight', muscleGroup: 'back', movementType: 'pull' },

  // Hombros (Push)
  { name: 'Press militar', nameEN: 'Overhead Press', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },
  { name: 'Press con mancuernas (hombro)', nameEN: 'Dumbbell Shoulder Press', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },
  { name: 'Elevaciones laterales', nameEN: 'Lateral Raises', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },
  { name: 'Elevaciones frontales', nameEN: 'Front Raises', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },
  { name: 'Pájaros', nameEN: 'Rear Delt Flyes', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },
  { name: 'Face pull', nameEN: 'Face Pull', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },

  // Bíceps (Pull)
  { name: 'Curl con barra', nameEN: 'Barbell Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl con mancuernas', nameEN: 'Dumbbell Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl martillo', nameEN: 'Hammer Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl en polea', nameEN: 'Cable Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl concentrado', nameEN: 'Concentration Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },

  // Tríceps (Push)
  { name: 'Press francés', nameEN: 'Skull Crushers', type: 'weight', muscleGroup: 'triceps', movementType: 'push' },
  { name: 'Extensión de tríceps en polea', nameEN: 'Tricep Pushdown', type: 'weight', muscleGroup: 'triceps', movementType: 'push' },
  { name: 'Fondos en banco', nameEN: 'Bench Dips', type: 'bodyweight', muscleGroup: 'triceps', movementType: 'push' },
  { name: 'Patada de tríceps', nameEN: 'Tricep Kickback', type: 'weight', muscleGroup: 'triceps', movementType: 'push' },

  // Piernas (Legs)
  { name: 'Sentadilla', nameEN: 'Squat', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Sentadilla frontal', nameEN: 'Front Squat', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Prensa de piernas', nameEN: 'Leg Press', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Extensión de cuádriceps', nameEN: 'Leg Extension', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Curl femoral', nameEN: 'Leg Curl', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Zancadas', nameEN: 'Lunges', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Hip thrust', nameEN: 'Hip Thrust', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Elevación de gemelos', nameEN: 'Calf Raise', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Sentadilla búlgara', nameEN: 'Bulgarian Split Squat', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Peso muerto rumano', nameEN: 'Romanian Deadlift', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Thrusters con mancuernas', nameEN: 'Dumbbell Thrusters', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },

  // Core
  { name: 'Crunch', nameEN: 'Crunch', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Crunch en polea', nameEN: 'Cable Crunch', type: 'weight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Crunches invertidos', nameEN: 'Reverse Crunches', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Plancha', nameEN: 'Plank', type: 'timed', muscleGroup: 'core', movementType: 'core' },
  { name: 'Plancha lateral', nameEN: 'Side Plank', type: 'timed', muscleGroup: 'core', movementType: 'core' },
  { name: 'Plancha con arrastre', nameEN: 'Plank Drag-Through', type: 'timed', muscleGroup: 'core', movementType: 'core' },
  { name: 'Elevación de piernas colgado', nameEN: 'Hanging Leg Raise', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Russian twist', nameEN: 'Russian Twist', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Rueda abdominal', nameEN: 'Ab Wheel Rollout', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Mountain Climbers', nameEN: 'Mountain Climbers', type: 'timed', muscleGroup: 'core', movementType: 'core' },
  { name: 'Burpees', nameEN: 'Burpees', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
];

// Definición de rutinas por nombre de ejercicio y series objetivo
const defaultRoutines = [
  {
    name: 'Día A – Empuje Funcional',
    exercises: [
      { exerciseName: 'Press de banca inclinado', targetSets: 4 },
      { exerciseName: 'Flexiones con déficit', targetSets: 3 },
      { exerciseName: 'Press militar', targetSets: 3 },
      { exerciseName: 'Fondos en paralelas', targetSets: 3 },
      { exerciseName: 'Flexiones declinadas', targetSets: 3 },
      { exerciseName: 'Elevaciones laterales', targetSets: 3 },
    ],
  },
  {
    name: 'Día B – Pierna Rodilla',
    exercises: [
      { exerciseName: 'Sentadilla frontal', targetSets: 4 },
      { exerciseName: 'Sentadilla búlgara', targetSets: 3 },
      { exerciseName: 'Prensa de piernas', targetSets: 3 },
      { exerciseName: 'Extensión de cuádriceps', targetSets: 3 },
      { exerciseName: 'Plancha con arrastre', targetSets: 3 },
    ],
  },
  {
    name: 'Día C – Tracción Funcional',
    exercises: [
      { exerciseName: 'Dominadas', targetSets: 4 },
      { exerciseName: 'Remo apoyado en pecho', targetSets: 3 },
      { exerciseName: 'Remo en polea baja', targetSets: 3 },
      { exerciseName: 'Face pull', targetSets: 3 },
      { exerciseName: 'Curl martillo', targetSets: 3 },
    ],
  },
  {
    name: 'Día D – Cadena Posterior',
    exercises: [
      { exerciseName: 'Peso muerto', targetSets: 4 },
      { exerciseName: 'Hip thrust', targetSets: 3 },
      { exerciseName: 'Curl femoral', targetSets: 3 },
      { exerciseName: 'Peso muerto rumano', targetSets: 3 },
      { exerciseName: 'Plancha lateral', targetSets: 3 },
    ],
  },
  {
    name: 'Día E – Full Body Metabólico',
    exercises: [
      { exerciseName: 'Thrusters con mancuernas', targetSets: 4 },
      { exerciseName: 'Burpees', targetSets: 3 },
      { exerciseName: 'Remo invertido', targetSets: 3 },
      { exerciseName: 'Mountain Climbers', targetSets: 3 },
      { exerciseName: 'Crunches invertidos', targetSets: 3 },
    ],
  },
];

// Lunes=0 ... Domingo=6 — asignación de rutinas por día
const weeklyAssignments = {
  0: 'Día A – Empuje Funcional',     // Lunes
  1: 'Día B – Pierna Rodilla',       // Martes
  // 2: Miércoles — Descanso
  3: 'Día C – Tracción Funcional',   // Jueves
  4: 'Día D – Cadena Posterior',     // Viernes
  5: 'Día E – Full Body Metabólico', // Sábado
  // 6: Domingo — Descanso
};

export async function seedExercises() {
  const count = await db.exercises.count();
  if (count === 0) {
    const exercises = defaultExercises.map(ex => ({
      ...ex,
      id: uuidv4(),
      isCustom: false,
      createdAt: Date.now(),
    }));
    await db.exercises.bulkAdd(exercises);
    return;
  }

  // Añadir ejercicios nuevos que no existan aún
  const existing = await db.exercises.toArray();
  const existingNames = new Set(existing.map(e => e.name));
  const toAdd = defaultExercises
    .filter(ex => !existingNames.has(ex.name))
    .map(ex => ({
      ...ex,
      id: uuidv4(),
      isCustom: false,
      createdAt: Date.now(),
    }));
  if (toAdd.length > 0) {
    await db.exercises.bulkAdd(toAdd);
  }
}

export async function seedSettings() {
  const settings = await db.userSettings.get('settings');
  if (!settings) {
    await db.userSettings.put({
      id: 'settings',
      name: '',
      theme: 'system',
      language: navigator.language.startsWith('es') ? 'es' : 'en',
      updatedAt: Date.now(),
    });
  }
}

export async function seedWeeklySchedule() {
  const count = await db.weeklySchedule.count();
  if (count === 0) {
    const days = Array.from({ length: 7 }, (_, i) => ({
      id: uuidv4(),
      dayOfWeek: i,
      routineId: null,
    }));
    await db.weeklySchedule.bulkAdd(days);
  }
}

export async function seedDefaultRoutines() {
  const routineCount = await db.routines.count();
  if (routineCount > 0) return;

  // Mapa nombre → id de ejercicios en DB
  const allExercises = await db.exercises.toArray();
  const nameToId = {};
  allExercises.forEach(e => { nameToId[e.name] = e.id; });

  const routineMap = {}; // nombre rutina → id

  for (const routine of defaultRoutines) {
    const id = uuidv4();
    routineMap[routine.name] = id;
    await db.routines.add({
      id,
      name: routine.name,
      exercises: routine.exercises
        .filter(e => nameToId[e.exerciseName])
        .map(e => ({
          exerciseId: nameToId[e.exerciseName],
          targetSets: e.targetSets,
        })),
      updatedAt: Date.now(),
    });
  }

  // Asignar rutinas a la programación semanal
  const schedule = await db.weeklySchedule.toArray();
  for (const day of schedule) {
    const routineName = weeklyAssignments[day.dayOfWeek];
    if (routineName && routineMap[routineName]) {
      await db.weeklySchedule.update(day.id, { routineId: routineMap[routineName] });
    }
  }
}

export async function initializeDatabase() {
  await seedExercises();
  await seedSettings();
  await seedWeeklySchedule();
  await seedDefaultRoutines();
}
