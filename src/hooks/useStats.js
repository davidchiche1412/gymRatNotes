import { useEffect, useState } from 'react';
import { getExercises } from '../db/queries/exercises';
import { getFinishedWorkouts } from '../db/queries/workouts';
import {
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
      const [exs, loadedWorkouts] = await Promise.all([getExercises(), getFinishedWorkouts()]);
      if (cancelled) return;

      setWorkouts(loadedWorkouts);
      const exerciseIdsWithWeightData = getExerciseIdsWithWeightData(loadedWorkouts);
      const nextExercisesWithProgress = exs.filter(exercise => exerciseIdsWithWeightData.has(exercise.id));
      const nextPrs = buildPersonalRecords(loadedWorkouts, exs);

      setExercises(exs);
      setExercisesWithProgress(nextExercisesWithProgress);
      setSelectedExercise(current => (
        nextExercisesWithProgress.some(exercise => exercise.id === current)
          ? current
          : nextExercisesWithProgress[0]?.id || ''
      ));
      setPrs(nextPrs);
      setMuscleGroupsWithPrs(getMuscleGroupsWithRecords(nextPrs));
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [language]);

  // Cachear workouts del primer load para no hacer doble fetch
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    if (!selectedExercise || workouts.length === 0) {
      setChartData([]);
      return;
    }

    const filtered = filterWorkoutsByTimeRange(workouts, timeRange);
    const data = selectedMetric === 'volume'
      ? buildVolumeData(filtered, selectedExercise, language)
      : buildMaxWeightData(filtered, selectedExercise, language);
    setChartData(data);
  }, [language, selectedExercise, selectedMetric, timeRange, workouts]);

  useEffect(() => {
    setFilteredPrs(filterRecordsByMuscleGroup(prs, selectedMuscleGroup));
  }, [prs, selectedMuscleGroup]);

  return {
    chartData,
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
