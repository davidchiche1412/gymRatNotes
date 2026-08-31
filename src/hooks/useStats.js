import { useEffect, useState } from 'react';
import { getExercises } from '../db/queries/exercises';
import { getFinishedWorkouts } from '../db/queries/workouts';
import {
  buildFrequencyData,
  buildMaxWeightData,
  buildVolumeData,
  buildPersonalRecords,
  filterRecordsByMuscleGroup,
  filterWorkoutsByTimeRange,
  getExerciseIdsWithWeightData,
  getMuscleGroupsWithRecords,
} from '../utils/stats';

export function useStats(language) {
  const [chartData, setChartData] = useState([]);
  const [frequencyData, setFrequencyData] = useState([]);
  const [prs, setPrs] = useState([]);
  const [filteredPrs, setFilteredPrs] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('maxWeight');
  const [timeRange, setTimeRange] = useState(3);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [exercises, setExercises] = useState([]);
  const [exercisesWithProgress, setExercisesWithProgress] = useState([]);
  const [muscleGroupsWithPrs, setMuscleGroupsWithPrs] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [exs, workouts] = await Promise.all([getExercises(), getFinishedWorkouts()]);
      if (cancelled) return;

      const exerciseIdsWithWeightData = getExerciseIdsWithWeightData(workouts);
      const nextExercisesWithProgress = exs.filter(exercise => exerciseIdsWithWeightData.has(exercise.id));
      const nextPrs = buildPersonalRecords(workouts, exs);

      setExercises(exs);
      setExercisesWithProgress(nextExercisesWithProgress);
      setSelectedExercise(current => (
        nextExercisesWithProgress.some(exercise => exercise.id === current)
          ? current
          : nextExercisesWithProgress[0]?.id || ''
      ));
      setFrequencyData(buildFrequencyData(workouts, language));
      setPrs(nextPrs);
      setMuscleGroupsWithPrs(getMuscleGroupsWithRecords(nextPrs));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    if (!selectedExercise) {
      setChartData([]);
      return;
    }
    let cancelled = false;

    async function load() {
      const workouts = await getFinishedWorkouts();
      if (cancelled) return;

      const filtered = filterWorkoutsByTimeRange(workouts, timeRange);
      const data = selectedMetric === 'volume'
        ? buildVolumeData(filtered, selectedExercise, language)
        : buildMaxWeightData(filtered, selectedExercise, language);
      setChartData(data);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [language, selectedExercise, selectedMetric, timeRange]);

  useEffect(() => {
    setFilteredPrs(filterRecordsByMuscleGroup(prs, selectedMuscleGroup));
  }, [prs, selectedMuscleGroup]);

  return {
    chartData,
    frequencyData,
    prs,
    filteredPrs,
    selectedExercise,
    setSelectedExercise,
    selectedMetric,
    setSelectedMetric,
    timeRange,
    setTimeRange,
    selectedMuscleGroup,
    setSelectedMuscleGroup,
    exercises,
    exercisesWithProgress,
    muscleGroupsWithPrs,
  };
}
