import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTodayWorkout,
  getTodayWorkoutProgress,
  getWorkoutSetInputValue,
  getWorkoutSetPlaceholder,
  getWorkoutSetSuggestions,
  resolveWorkoutSetFallbackValue,
} from './todayWorkoutView.js';

test('buildTodayWorkout joins routine, workout and exercise info for the UI', () => {
  const todayWorkout = buildTodayWorkout({
    dayOfWeek: 0,
    routine: {
      id: 'routine-a',
      name: 'Día A',
      restTime: 90,
      exercises: [{ exerciseId: 'bench', targetSets: 2, targetWeight: 80, targetReps: 8 }],
    },
    workout: {
      id: 'workout-1',
      date: 123,
      status: 'in_progress',
      finishedAt: null,
      exercises: [{
        exerciseId: 'bench',
        notes: null,
        sets: [{ weight: 82.5, reps: 8, duration: null, completed: true }],
      }],
      prefilledExercises: [{
        exerciseId: 'bench',
        sets: [{ weight: 80, reps: 8, duration: null }],
      }],
    },
    exerciseInfoMap: {
      bench: {
        name: 'Press de banca',
        nameEN: 'Bench Press',
        type: 'weight',
        muscleGroup: 'chest',
        movementType: 'push',
      },
    },
  });

  assert.equal(todayWorkout.routineName, 'Día A');
  assert.equal(todayWorkout.dayOfWeek, 0);
  assert.equal(todayWorkout.exercises[0].name, 'Press de banca');
  assert.equal(todayWorkout.exercises[0].targetWeight, 80);
  assert.equal(todayWorkout.exercises[0].targetWeightMode, 'total');
  assert.deepEqual(todayWorkout.exercises[0].prefilledSets, [{ weight: 80, reps: 8, duration: null }]);
});

test('getTodayWorkoutProgress returns totals and percentage', () => {
  const progress = getTodayWorkoutProgress({
    exercises: [
      { sets: [{ completed: true }, { completed: false }] },
      { sets: [{ completed: true }] },
    ],
  });

  assert.deepEqual(progress, {
    totalSets: 3,
    completedSets: 2,
    progress: 67,
  });
});

// ── getWorkoutSetInputValue ──────────────────────────────────────────────────

test('getWorkoutSetInputValue: set sin editar en not_started muestra vacío', () => {
  const set = { weight: 80, reps: 8, completed: false };
  assert.equal(getWorkoutSetInputValue('not_started', set, 'weight'), '');
});

test('getWorkoutSetInputValue: set sin editar en draft muestra el valor histórico', () => {
  // En draft los inputs se auto-rellenan con el valor histórico del set
  const set = { weight: 80, reps: 8, completed: false };
  assert.equal(getWorkoutSetInputValue('draft', set, 'weight'), 80);
});

test('getWorkoutSetInputValue: set sin editar en in_progress muestra el valor histórico', () => {
  const set = { weight: 80, reps: 8, completed: false };
  assert.equal(getWorkoutSetInputValue('in_progress', set, 'weight'), 80);
});

test('getWorkoutSetInputValue: set completado siempre muestra valor', () => {
  const set = { weight: 80, reps: 8, completed: true };
  assert.equal(getWorkoutSetInputValue('not_started', set, 'weight'), 80);
  assert.equal(getWorkoutSetInputValue('draft', set, 'weight'), 80);
});

test('getWorkoutSetInputValue: set userEdited en not_started muestra valor', () => {
  // El usuario acaba de teclear algo en not_started → debe verse
  const set = { weight: 90, reps: 10, completed: false, userEdited: true };
  assert.equal(getWorkoutSetInputValue('not_started', set, 'weight'), 90);
});

// ── getWorkoutSetPlaceholder ──────────────────────────────────────────────────

test('getWorkoutSetPlaceholder: usa prefilled si no hay series editadas previas', () => {
  const prefilledSets = [{ weight: 50, reps: 10 }, { weight: 50, reps: 10 }];
  const sets = [
    { weight: 50, reps: 10, completed: false }, // prefilled, no editado
    { weight: null, reps: null, completed: false },
  ];
  // No propaga el 50 de set 0 porque no está editado ni completado
  assert.equal(getWorkoutSetPlaceholder(prefilledSets, sets, 1, 'weight'), 50);
});

test('getWorkoutSetPlaceholder: propaga peso de serie completada', () => {
  const prefilledSets = [{ weight: 50, reps: 10 }, { weight: 50, reps: 10 }, { weight: 50, reps: 10 }];
  const sets = [
    { weight: 60, reps: 10, completed: true },
    { weight: null, reps: null, completed: false },
    { weight: null, reps: null, completed: false },
  ];
  assert.equal(getWorkoutSetPlaceholder(prefilledSets, sets, 0, 'weight'), 50); // sin previas
  assert.equal(getWorkoutSetPlaceholder(prefilledSets, sets, 1, 'weight'), 60); // propaga completada
  assert.equal(getWorkoutSetPlaceholder(prefilledSets, sets, 2, 'weight'), 60); // retrocede al 60
});

test('getWorkoutSetPlaceholder: propaga peso de serie userEdited', () => {
  const prefilledSets = [{ weight: 50, reps: 10 }, { weight: 50, reps: 10 }];
  const sets = [
    { weight: 75, reps: 10, completed: false, userEdited: true },
    { weight: null, reps: null, completed: false },
  ];
  assert.equal(getWorkoutSetPlaceholder(prefilledSets, sets, 1, 'weight'), 75);
});

test('resolveWorkoutSetFallbackValue: devuelve null si no hay fallback', () => {
  assert.equal(resolveWorkoutSetFallbackValue([], [], 0, 'weight'), null);
});

// ── getWorkoutSetSuggestions ──────────────────────────────────────────────────

test('getWorkoutSetSuggestions: sin datos devuelve vacío', () => {
  assert.deepEqual(getWorkoutSetSuggestions([], [], 0, 'weight'), []);
});

test('getWorkoutSetSuggestions: campo null devuelve vacío', () => {
  assert.deepEqual(getWorkoutSetSuggestions([], [], 0, null), []);
});

test('getWorkoutSetSuggestions: primera serie solo usa histórico prefilled', () => {
  const prefilledSets = [{ weight: 80, reps: 8 }];
  const sets = [{ weight: null, reps: null, completed: false }];
  assert.deepEqual(getWorkoutSetSuggestions(prefilledSets, sets, 0, 'weight'), [80]);
});

test('getWorkoutSetSuggestions: ignora set prefilled sin editar ni completar', () => {
  const prefilledSets = [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }];
  const sets = [
    { weight: 80, reps: 8, completed: false }, // prefilled, NO userEdited
    { weight: null, reps: null, completed: false },
  ];
  // El set 0 no cuenta como "introducido" → solo sale el histórico
  const s = getWorkoutSetSuggestions(prefilledSets, sets, 1, 'weight');
  assert.equal(s.length, 1);
  assert.equal(s[0], 80);
});

test('getWorkoutSetSuggestions: set userEdited aparece como primera sugerencia', () => {
  const prefilledSets = [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }];
  const sets = [
    { weight: 90, reps: 8, completed: false, userEdited: true },
    { weight: null, reps: null, completed: false },
  ];
  const s = getWorkoutSetSuggestions(prefilledSets, sets, 1, 'weight');
  assert.equal(s[0], 90); // editado por usuario
  assert.equal(s[1], 80); // histórico distinto
  assert.equal(s.length, 2);
});

test('getWorkoutSetSuggestions: set completado aparece como primera sugerencia', () => {
  const prefilledSets = [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }];
  const sets = [
    { weight: 90, reps: 8, completed: true },
    { weight: null, reps: null, completed: false },
  ];
  const s = getWorkoutSetSuggestions(prefilledSets, sets, 1, 'weight');
  assert.equal(s[0], 90);
  assert.equal(s[1], 80);
  assert.equal(s.length, 2);
});

test('getWorkoutSetSuggestions: no duplica si peso anterior == histórico', () => {
  const prefilledSets = [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }];
  const sets = [
    { weight: 80, reps: 8, completed: true },
    { weight: null, reps: null, completed: false },
  ];
  const s = getWorkoutSetSuggestions(prefilledSets, sets, 1, 'weight');
  assert.equal(s.length, 1);
  assert.equal(s[0], 80);
});

// ── Edge cases y regresiones ──────────────────────────────────────────────────

test('buildTodayWorkout returns null if routine is null', () => {
  assert.equal(buildTodayWorkout({ routine: null, workout: {}, dayOfWeek: 0 }), null);
});

test('buildTodayWorkout returns null if workout is null', () => {
  assert.equal(buildTodayWorkout({ routine: { exercises: [] }, workout: null, dayOfWeek: 0 }), null);
});

test('getTodayWorkoutProgress handles null/empty workout', () => {
  assert.deepEqual(getTodayWorkoutProgress(null), { totalSets: 0, completedSets: 0, progress: 0 });
  assert.deepEqual(getTodayWorkoutProgress({ exercises: [] }), { totalSets: 0, completedSets: 0, progress: 0 });
});

test('getWorkoutSetInputValue handles null field value', () => {
  const set = { weight: null, reps: null, completed: false };
  assert.equal(getWorkoutSetInputValue('in_progress', set, 'weight'), '');
});

test('resolveWorkoutSetFallbackValue skips sets without userEdited or completed', () => {
  const sets = [
    { weight: 50, reps: 10, completed: false },
    { weight: 60, reps: 8, completed: false },
    { weight: null, reps: null, completed: false },
  ];
  // Ninguna serie anterior está completed ni userEdited → fallback a prefilled
  const prefilledSets = [null, null, { weight: 70, reps: 10 }];
  assert.equal(resolveWorkoutSetFallbackValue(prefilledSets, sets, 2, 'weight'), 70);
});

test('getWorkoutSetPlaceholder returns dash when no fallback exists', () => {
  assert.equal(getWorkoutSetPlaceholder([], [], 0, 'weight'), '—');
});

test('getWorkoutSetSuggestions handles empty prefilledSets', () => {
  const sets = [{ weight: 80, reps: 8, completed: true }];
  const s = getWorkoutSetSuggestions([], sets, 1, 'weight');
  // Serie anterior completada con 80, sin prefilled → solo 80
  assert.equal(s.length, 1);
  assert.equal(s[0], 80);
});
