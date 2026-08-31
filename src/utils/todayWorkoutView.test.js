import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTodayWorkout,
  getTodayWorkoutProgress,
  getWorkoutSetInputValue,
  getWorkoutSetPlaceholder,
  getWorkoutSetSuggestions,
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

test('workout set inputs use prefilled data as placeholders before starting', () => {
  const set = { weight: 80, reps: 8, completed: false };
  const prefilledSets = [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }];
  const sets = [set, { weight: null, reps: null, completed: false }];

  assert.equal(getWorkoutSetInputValue('not_started', set, 'weight'), '');
  // Sin series previas con valor → usa prefilled
  assert.equal(getWorkoutSetPlaceholder(prefilledSets, sets, 0, 'weight'), 80);
  // Serie 0 tiene valor → la serie 1 lo hereda
  assert.equal(getWorkoutSetPlaceholder(prefilledSets, sets, 1, 'weight'), 80);
  assert.equal(getWorkoutSetInputValue('in_progress', set, 'weight'), 80);
});

test('getWorkoutSetPlaceholder propagates entered weight to subsequent sets', () => {
  const prefilledSets = [{ weight: 50, reps: 10 }, { weight: 50, reps: 10 }, { weight: 50, reps: 10 }];
  const sets = [
    { weight: 60, reps: 10, completed: true },
    { weight: null, reps: null, completed: false },
    { weight: null, reps: null, completed: false },
  ];

  // Set 0: no hay previas con valor, cae al prefilled
  assert.equal(getWorkoutSetPlaceholder(prefilledSets, sets, 0, 'weight'), 50);
  // Set 1: serie anterior tiene 60 → placeholder = 60
  assert.equal(getWorkoutSetPlaceholder(prefilledSets, sets, 1, 'weight'), 60);
  // Set 2: serie anterior (índice 1) no tiene valor, retrocede al índice 0 que sí tiene 60
  assert.equal(getWorkoutSetPlaceholder(prefilledSets, sets, 2, 'weight'), 60);
});

test('getWorkoutSetSuggestions: sin datos previos ni histórico devuelve vacío', () => {
  const sets = [{ weight: null, reps: null, completed: false }];
  assert.deepEqual(getWorkoutSetSuggestions([], sets, 0, 'weight', 'in_progress'), []);
});

test('getWorkoutSetSuggestions: primera serie solo usa histórico prefilled', () => {
  const prefilledSets = [{ weight: 80, reps: 8 }];
  const sets = [{ weight: null, reps: null, completed: false }];
  assert.deepEqual(getWorkoutSetSuggestions(prefilledSets, sets, 0, 'weight', 'in_progress'), [80]);
});

test('getWorkoutSetSuggestions: serie siguiente muestra peso anterior como primera sugerencia', () => {
  const prefilledSets = [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }];
  const sets = [
    { weight: 90, reps: 8, completed: true },
    { weight: null, reps: null, completed: false },
  ];
  // Primera sugerencia: 90 (introducido). Segunda: 80 (histórico distinto)
  const s = getWorkoutSetSuggestions(prefilledSets, sets, 1, 'weight', 'in_progress');
  assert.equal(s[0], 90);
  assert.equal(s[1], 80);
  assert.equal(s.length, 2);
});

test('getWorkoutSetSuggestions: no duplica si el peso anterior coincide con el histórico', () => {
  const prefilledSets = [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }];
  const sets = [
    { weight: 80, reps: 8, completed: true },
    { weight: null, reps: null, completed: false },
  ];
  // El peso anterior (80) == histórico (80) → solo una sugerencia
  const s = getWorkoutSetSuggestions(prefilledSets, sets, 1, 'weight', 'in_progress');
  assert.equal(s.length, 1);
  assert.equal(s[0], 80);
});

test('getWorkoutSetSuggestions: ignora series previas con valor null o vacío', () => {
  const prefilledSets = [{ weight: 70, reps: 8 }, { weight: 70, reps: 8 }, { weight: 70, reps: 8 }];
  const sets = [
    { weight: null, reps: null, completed: false },
    { weight: null, reps: null, completed: false },
    { weight: null, reps: null, completed: false },
  ];
  // Todas vacías → solo histórico
  const s = getWorkoutSetSuggestions(prefilledSets, sets, 2, 'weight', 'in_progress');
  assert.equal(s.length, 1);
  assert.equal(s[0], 70);
});

test('getWorkoutSetSuggestions: campo null en focusedField devuelve vacío', () => {
  const s = getWorkoutSetSuggestions([], [], 0, null, 'in_progress');
  assert.deepEqual(s, []);
});

test('getWorkoutSetSuggestions: en not_started ignora valores prefilled de sets anteriores', () => {
  // En not_started, sets[i].weight viene del histórico, no del usuario
  const prefilledSets = [{ weight: 80, reps: 8 }, { weight: 80, reps: 8 }];
  const sets = [
    { weight: 80, reps: 8, completed: false }, // prefilled, no introducido por el usuario
    { weight: null, reps: null, completed: false },
  ];
  // No debe aparecer 80 como "serie anterior" porque el workout no ha empezado
  const s = getWorkoutSetSuggestions(prefilledSets, sets, 1, 'weight', 'not_started');
  // Solo debería salir el histórico prefilled del índice 1
  assert.equal(s.length, 1);
  assert.equal(s[0], 80);
});

test('getWorkoutSetSuggestions: set completado en not_started sí cuenta como usuario', () => {
  const prefilledSets = [{ weight: 90, reps: 8 }, { weight: 80, reps: 8 }];
  const sets = [
    { weight: 90, reps: 8, completed: true }, // completado = introducido por el usuario
    { weight: null, reps: null, completed: false },
  ];
  const s = getWorkoutSetSuggestions(prefilledSets, sets, 1, 'weight', 'not_started');
  assert.equal(s[0], 90); // serie anterior completada
  assert.equal(s[1], 80); // histórico distinto
  assert.equal(s.length, 2);
});
