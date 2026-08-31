import { getLocale } from './formatDate.js';

export function getExerciseIdsWithWeightData(workouts) {
  return new Set(workouts.flatMap(workout =>
    workout.exercises
      .filter(exercise => exercise.sets.some(set => set.weight != null))
      .map(exercise => exercise.exerciseId)
  ));
}

export function buildMaxWeightData(workouts, selectedExercise, language) {
  const locale = getLocale(language);
  const data = [];

  workouts.slice().sort((a, b) => a.date - b.date).forEach(workout => {
    const exercise = workout.exercises.find(ex => ex.exerciseId === selectedExercise);
    if (!exercise) return;

    const maxWeight = Math.max(...exercise.sets.filter(set => set.weight != null).map(set => set.weight), 0);
    if (maxWeight > 0) {
      data.push({
        date: new Date(workout.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
        weight: maxWeight,
      });
    }
  });

  return data;
}

export function buildFrequencyData(workouts, language) {
  const locale = getLocale(language);
  const weekMap = {};

  workouts.forEach(workout => {
    const date = new Date(workout.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];
    weekMap[key] = (weekMap[key] || 0) + 1;
  });

  return Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, count]) => ({
      week: new Date(week).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
      count,
    }));
}

export function buildPersonalRecords(workouts, exercises) {
  const exerciseMap = Object.fromEntries(exercises.map(exercise => [exercise.id, exercise]));
  const recordMap = {};

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.weight == null || set.reps == null) return;

        const volume = set.weight * set.reps;
        if (!recordMap[exercise.exerciseId] || volume > recordMap[exercise.exerciseId].volume) {
          recordMap[exercise.exerciseId] = { weight: set.weight, reps: set.reps, volume, date: workout.date };
        }
      });
    });
  });

  return Object.entries(recordMap)
    .map(([exerciseId, record]) => ({ exercise: exerciseMap[exerciseId], ...record }))
    .filter(record => record.exercise)
    .sort((a, b) => b.volume - a.volume);
}

export function getMuscleGroupsWithRecords(records) {
  return [...new Set(records.map(record => record.exercise.muscleGroup).filter(Boolean))].sort();
}

export function filterRecordsByMuscleGroup(records, muscleGroup) {
  if (!muscleGroup) return records;
  return records.filter(record => record.exercise.muscleGroup === muscleGroup);
}

export function buildVolumeData(workouts, selectedExercise, language) {
  const locale = getLocale(language);
  const data = [];

  workouts.slice().sort((a, b) => a.date - b.date).forEach(workout => {
    const exercise = workout.exercises.find(ex => ex.exerciseId === selectedExercise);
    if (!exercise) return;

    const volume = exercise.sets
      .filter(set => set.weight != null && set.reps != null)
      .reduce((sum, set) => sum + set.weight * set.reps, 0);
    if (volume > 0) {
      data.push({
        date: new Date(workout.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
        volume,
      });
    }
  });

  return data;
}

export function filterWorkoutsByTimeRange(workouts, months) {
  const cutoff = Date.now() - months * 30 * 24 * 60 * 60 * 1000;
  return workouts.filter(workout => workout.date >= cutoff);
}
