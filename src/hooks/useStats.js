import { useEffect, useState } from 'react';
import { getExercises } from '../db/queries/exercises';
import { getFinishedWorkouts } from '../db/queries/workouts';

function getLocale(language) {
  return language === 'es' ? 'es-ES' : 'en-US';
}

function buildMaxWeightData(workouts, selectedExercise, language) {
  const locale = getLocale(language);
  const data = [];

  workouts.sort((a, b) => a.date - b.date).forEach(w => {
    const ex = w.exercises.find(e => e.exerciseId === selectedExercise);
    if (!ex) return;

    const maxW = Math.max(...ex.sets.filter(s => s.weight != null).map(s => s.weight), 0);
    if (maxW > 0) {
      data.push({
        date: new Date(w.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
        weight: maxW,
      });
    }
  });

  return data;
}

function buildFrequencyData(workouts, language) {
  const locale = getLocale(language);
  const weekMap = {};

  workouts.forEach(w => {
    const d = new Date(w.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
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

function buildPersonalRecords(workouts, exercises) {
  const prMap = {};
  const exMap = {};
  exercises.forEach(e => { exMap[e.id] = e; });

  workouts.forEach(w => {
    w.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.weight == null || s.reps == null) return;

        const volume = s.weight * s.reps;
        if (!prMap[ex.exerciseId] || volume > prMap[ex.exerciseId].volume) {
          prMap[ex.exerciseId] = { weight: s.weight, reps: s.reps, volume, date: w.date };
        }
      });
    });
  });

  return Object.entries(prMap)
    .map(([exId, pr]) => ({ exercise: exMap[exId], ...pr }))
    .filter(pr => pr.exercise)
    .sort((a, b) => b.volume - a.volume);
}

export function useStats(language) {
  const [maxWeightData, setMaxWeightData] = useState([]);
  const [frequencyData, setFrequencyData] = useState([]);
  const [prs, setPrs] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const exs = await getExercises();
      if (cancelled) return;

      setExercises(exs);
      if (exs.length > 0) setSelectedExercise(current => current || exs[0].id);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const workouts = await getFinishedWorkouts();
      if (cancelled) return;

      setFrequencyData(buildFrequencyData(workouts, language));
      setPrs(buildPersonalRecords(workouts, exercises));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [exercises, language]);

  useEffect(() => {
    if (!selectedExercise) return;
    let cancelled = false;

    async function load() {
      const workouts = await getFinishedWorkouts();
      if (cancelled) return;

      setMaxWeightData(buildMaxWeightData(workouts, selectedExercise, language));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [language, selectedExercise]);

  return {
    maxWeightData,
    frequencyData,
    prs,
    selectedExercise,
    setSelectedExercise,
    exercises,
  };
}
