import { v4 as uuidv4 } from 'uuid';
import { db } from './database';

const defaultExercises = [
  // === PECHO (Push) ===
  { name: 'Press de banca', nameEN: 'Bench Press', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Press de banca inclinado', nameEN: 'Incline Bench Press', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Press de banca declinado', nameEN: 'Decline Bench Press', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Press con mancuernas', nameEN: 'Dumbbell Press', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Press inclinado con mancuernas', nameEN: 'Incline Dumbbell Press', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Aperturas con mancuernas', nameEN: 'Dumbbell Flyes', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Aperturas inclinadas con mancuernas', nameEN: 'Incline Dumbbell Flyes', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Aperturas en polea', nameEN: 'Cable Flyes', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Cruces en polea alta', nameEN: 'High Cable Crossover', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Cruces en polea baja', nameEN: 'Low Cable Crossover', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Press en máquina', nameEN: 'Machine Chest Press', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Pec deck (mariposa)', nameEN: 'Pec Deck Machine', type: 'weight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Fondos en paralelas', nameEN: 'Parallel Bar Dips', type: 'bodyweight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Flexiones', nameEN: 'Push-ups', type: 'bodyweight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Flexiones con déficit', nameEN: 'Deficit Push-ups', type: 'bodyweight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Flexiones declinadas', nameEN: 'Decline Push-ups', type: 'bodyweight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Flexiones diamante', nameEN: 'Diamond Push-ups', type: 'bodyweight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Flexiones con palmada', nameEN: 'Clap Push-ups', type: 'bodyweight', muscleGroup: 'chest', movementType: 'push' },
  { name: 'Pullover con mancuerna', nameEN: 'Dumbbell Pullover', type: 'weight', muscleGroup: 'chest', movementType: 'push' },

  // === ESPALDA (Pull) ===
  { name: 'Dominadas', nameEN: 'Pull-ups', type: 'bodyweight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Dominadas supinas', nameEN: 'Chin-ups', type: 'bodyweight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Dominadas neutras', nameEN: 'Neutral Grip Pull-ups', type: 'bodyweight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Jalón al pecho', nameEN: 'Lat Pulldown', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Jalón agarre cerrado', nameEN: 'Close Grip Pulldown', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Jalón tras nuca', nameEN: 'Behind Neck Pulldown', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo con barra', nameEN: 'Barbell Row', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo con mancuerna', nameEN: 'Dumbbell Row', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo en polea baja', nameEN: 'Seated Cable Row', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo apoyado en pecho', nameEN: 'Chest-Supported Row', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo invertido', nameEN: 'Inverted Row', type: 'bodyweight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo Pendlay', nameEN: 'Pendlay Row', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo en máquina', nameEN: 'Machine Row', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo T-bar', nameEN: 'T-Bar Row', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Remo Meadows', nameEN: 'Meadows Row', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Pull-over en polea', nameEN: 'Cable Pullover', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Pull-over', nameEN: 'Pull-over', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Peso muerto', nameEN: 'Deadlift', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Peso muerto sumo', nameEN: 'Sumo Deadlift', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Encogimientos con barra', nameEN: 'Barbell Shrugs', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Encogimientos con mancuernas', nameEN: 'Dumbbell Shrugs', type: 'weight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Hiperextensiones', nameEN: 'Back Extensions', type: 'bodyweight', muscleGroup: 'back', movementType: 'pull' },
  { name: 'Superman', nameEN: 'Superman Hold', type: 'timed', muscleGroup: 'back', movementType: 'pull' },

  // === HOMBROS ===
  { name: 'Press militar', nameEN: 'Overhead Press', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },
  { name: 'Press con mancuernas (hombro)', nameEN: 'Dumbbell Shoulder Press', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },
  { name: 'Press Arnold', nameEN: 'Arnold Press', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },
  { name: 'Press en máquina de hombros', nameEN: 'Machine Shoulder Press', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },
  { name: 'Press landmine', nameEN: 'Landmine Press', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },
  { name: 'Elevaciones laterales', nameEN: 'Lateral Raises', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },
  { name: 'Elevaciones laterales en polea', nameEN: 'Cable Lateral Raises', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },
  { name: 'Elevaciones frontales', nameEN: 'Front Raises', type: 'weight', muscleGroup: 'shoulders', movementType: 'push' },
  { name: 'Pájaros (deltoides posterior)', nameEN: 'Rear Delt Flyes', type: 'weight', muscleGroup: 'shoulders', movementType: 'pull' },
  { name: 'Pájaros en polea', nameEN: 'Cable Rear Delt Flyes', type: 'weight', muscleGroup: 'shoulders', movementType: 'pull' },
  { name: 'Face pull', nameEN: 'Face Pull', type: 'weight', muscleGroup: 'shoulders', movementType: 'pull' },
  { name: 'Remo al mentón', nameEN: 'Upright Row', type: 'weight', muscleGroup: 'shoulders', movementType: 'pull' },
  { name: 'Pájaro en máquina', nameEN: 'Reverse Pec Deck', type: 'weight', muscleGroup: 'shoulders', movementType: 'pull' },

  // === BÍCEPS ===
  { name: 'Curl con barra', nameEN: 'Barbell Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl con barra Z', nameEN: 'EZ Bar Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl con mancuernas', nameEN: 'Dumbbell Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl martillo', nameEN: 'Hammer Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl en polea', nameEN: 'Cable Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl concentrado', nameEN: 'Concentration Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl inclinado', nameEN: 'Incline Dumbbell Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl predicador', nameEN: 'Preacher Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl araña', nameEN: 'Spider Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl 21s', nameEN: '21s Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl en máquina', nameEN: 'Machine Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },
  { name: 'Curl inverso', nameEN: 'Reverse Curl', type: 'weight', muscleGroup: 'biceps', movementType: 'pull' },

  // === TRÍCEPS ===
  { name: 'Press francés', nameEN: 'Skull Crushers', type: 'weight', muscleGroup: 'triceps', movementType: 'push' },
  { name: 'Press francés con mancuernas', nameEN: 'Dumbbell Skull Crushers', type: 'weight', muscleGroup: 'triceps', movementType: 'push' },
  { name: 'Extensión de tríceps en polea', nameEN: 'Tricep Pushdown', type: 'weight', muscleGroup: 'triceps', movementType: 'push' },
  { name: 'Extensión con cuerda', nameEN: 'Rope Pushdown', type: 'weight', muscleGroup: 'triceps', movementType: 'push' },
  { name: 'Extensión overhead con polea', nameEN: 'Cable Overhead Extension', type: 'weight', muscleGroup: 'triceps', movementType: 'push' },
  { name: 'Extensión overhead con mancuerna', nameEN: 'Overhead Dumbbell Extension', type: 'weight', muscleGroup: 'triceps', movementType: 'push' },
  { name: 'Fondos en banco', nameEN: 'Bench Dips', type: 'bodyweight', muscleGroup: 'triceps', movementType: 'push' },
  { name: 'Patada de tríceps', nameEN: 'Tricep Kickback', type: 'weight', muscleGroup: 'triceps', movementType: 'push' },
  { name: 'Press cerrado', nameEN: 'Close Grip Bench Press', type: 'weight', muscleGroup: 'triceps', movementType: 'push' },
  { name: 'Fondos en máquina', nameEN: 'Machine Dips', type: 'weight', muscleGroup: 'triceps', movementType: 'push' },

  // === PIERNAS: Cuádriceps ===
  { name: 'Sentadilla', nameEN: 'Squat', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Sentadilla frontal', nameEN: 'Front Squat', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Sentadilla goblet', nameEN: 'Goblet Squat', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Sentadilla hack', nameEN: 'Hack Squat', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Sentadilla búlgara', nameEN: 'Bulgarian Split Squat', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Sentadilla sissy', nameEN: 'Sissy Squat', type: 'bodyweight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Sentadilla en Smith', nameEN: 'Smith Machine Squat', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Prensa de piernas', nameEN: 'Leg Press', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Prensa inclinada', nameEN: 'Incline Leg Press', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Extensión de cuádriceps', nameEN: 'Leg Extension', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Zancadas', nameEN: 'Lunges', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Zancadas caminando', nameEN: 'Walking Lunges', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Zancadas inversas', nameEN: 'Reverse Lunges', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Step-up', nameEN: 'Step-ups', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Sentadilla pistol', nameEN: 'Pistol Squat', type: 'bodyweight', muscleGroup: 'legs', movementType: 'legs' },

  // === PIERNAS: Isquiotibiales y Glúteos ===
  { name: 'Peso muerto rumano', nameEN: 'Romanian Deadlift', type: 'weight', muscleGroup: 'glutes', movementType: 'legs' },
  { name: 'Peso muerto rumano con mancuernas', nameEN: 'Dumbbell Romanian Deadlift', type: 'weight', muscleGroup: 'glutes', movementType: 'legs' },
  { name: 'Peso muerto a una pierna', nameEN: 'Single Leg Deadlift', type: 'weight', muscleGroup: 'glutes', movementType: 'legs' },
  { name: 'Hip thrust', nameEN: 'Hip Thrust', type: 'weight', muscleGroup: 'glutes', movementType: 'legs' },
  { name: 'Hip thrust a una pierna', nameEN: 'Single Leg Hip Thrust', type: 'bodyweight', muscleGroup: 'glutes', movementType: 'legs' },
  { name: 'Puente de glúteos', nameEN: 'Glute Bridge', type: 'bodyweight', muscleGroup: 'glutes', movementType: 'legs' },
  { name: 'Curl femoral', nameEN: 'Leg Curl', type: 'weight', muscleGroup: 'glutes', movementType: 'legs' },
  { name: 'Curl femoral nórdico', nameEN: 'Nordic Curl', type: 'bodyweight', muscleGroup: 'glutes', movementType: 'legs' },
  { name: 'Buenos días', nameEN: 'Good Mornings', type: 'weight', muscleGroup: 'glutes', movementType: 'legs' },
  { name: 'Patada de glúteo en polea', nameEN: 'Cable Kickback', type: 'weight', muscleGroup: 'glutes', movementType: 'legs' },
  { name: 'Abducción de cadera', nameEN: 'Hip Abduction', type: 'weight', muscleGroup: 'glutes', movementType: 'legs' },
  { name: 'Aducción de cadera', nameEN: 'Hip Adduction', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },

  // === PIERNAS: Gemelos ===
  { name: 'Elevación de gemelos de pie', nameEN: 'Standing Calf Raise', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Elevación de gemelos sentado', nameEN: 'Seated Calf Raise', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Elevación de gemelos en prensa', nameEN: 'Leg Press Calf Raise', type: 'weight', muscleGroup: 'legs', movementType: 'legs' },
  { name: 'Gemelos a una pierna', nameEN: 'Single Leg Calf Raise', type: 'bodyweight', muscleGroup: 'legs', movementType: 'legs' },

  // === CORE ===
  { name: 'Crunch', nameEN: 'Crunch', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Crunch en polea', nameEN: 'Cable Crunch', type: 'weight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Crunches invertidos', nameEN: 'Reverse Crunches', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Crunch bicicleta', nameEN: 'Bicycle Crunch', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Plancha', nameEN: 'Plank', type: 'timed', muscleGroup: 'core', movementType: 'core' },
  { name: 'Plancha lateral', nameEN: 'Side Plank', type: 'timed', muscleGroup: 'core', movementType: 'core' },
  { name: 'Plancha con arrastre', nameEN: 'Plank Drag-Through', type: 'timed', muscleGroup: 'core', movementType: 'core' },
  { name: 'Elevación de piernas colgado', nameEN: 'Hanging Leg Raise', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Elevación de piernas en banco', nameEN: 'Lying Leg Raise', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Elevación de rodillas colgado', nameEN: 'Hanging Knee Raise', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Russian twist', nameEN: 'Russian Twist', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Rueda abdominal', nameEN: 'Ab Wheel Rollout', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Leñador en polea', nameEN: 'Cable Woodchop', type: 'weight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Pallof press', nameEN: 'Pallof Press', type: 'weight', muscleGroup: 'core', movementType: 'core' },
  { name: 'V-ups', nameEN: 'V-ups', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Dead bug', nameEN: 'Dead Bug', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Bird dog', nameEN: 'Bird Dog', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },
  { name: 'Mountain Climbers', nameEN: 'Mountain Climbers', type: 'timed', muscleGroup: 'core', movementType: 'core' },
  { name: 'Burpees', nameEN: 'Burpees', type: 'bodyweight', muscleGroup: 'core', movementType: 'core' },

  // === ANTEBRAZO / AGARRE ===
  { name: 'Curl de muñeca', nameEN: 'Wrist Curl', type: 'weight', muscleGroup: 'forearms', movementType: 'pull' },
  { name: 'Curl de muñeca inverso', nameEN: 'Reverse Wrist Curl', type: 'weight', muscleGroup: 'forearms', movementType: 'pull' },
  { name: 'Farmer walk', nameEN: 'Farmer Walk', type: 'weight', muscleGroup: 'forearms', movementType: 'pull' },
  { name: 'Agarre en barra', nameEN: 'Dead Hang', type: 'timed', muscleGroup: 'forearms', movementType: 'pull' },

  // === FULL BODY / FUNCIONAL ===
  { name: 'Thrusters con mancuernas', nameEN: 'Dumbbell Thrusters', type: 'weight', muscleGroup: 'fullbody', movementType: 'legs' },
  { name: 'Thrusters con barra', nameEN: 'Barbell Thrusters', type: 'weight', muscleGroup: 'fullbody', movementType: 'legs' },
  { name: 'Clean and press', nameEN: 'Clean and Press', type: 'weight', muscleGroup: 'fullbody', movementType: 'pull' },
  { name: 'Snatch con mancuerna', nameEN: 'Dumbbell Snatch', type: 'weight', muscleGroup: 'fullbody', movementType: 'pull' },
  { name: 'Turkish get-up', nameEN: 'Turkish Get-up', type: 'weight', muscleGroup: 'fullbody', movementType: 'core' },
  { name: 'Kettlebell swing', nameEN: 'Kettlebell Swing', type: 'weight', muscleGroup: 'fullbody', movementType: 'pull' },
  { name: 'Battle ropes', nameEN: 'Battle Ropes', type: 'timed', muscleGroup: 'fullbody', movementType: 'push' },
  { name: 'Box jumps', nameEN: 'Box Jumps', type: 'bodyweight', muscleGroup: 'fullbody', movementType: 'legs' },
  { name: 'Saltos al cajón', nameEN: 'Box Step-ups', type: 'bodyweight', muscleGroup: 'fullbody', movementType: 'legs' },
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
