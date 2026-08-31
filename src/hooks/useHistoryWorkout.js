import { useCallback, useEffect, useState } from 'react';
import { finishAllWorkoutSets, shouldShowWorkoutInHistory } from '../utils/workoutSync';
import { getExercisesByIds } from '../db/queries/exercises';
import { deleteWorkout, getWorkouts, saveWorkout } from '../db/queries/workouts';

async function getHistoryData() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCutoff = todayStart.getTime();

  const all = (await getWorkouts())
    .filter(w => shouldShowWorkoutInHistory(w) && w.date < todayCutoff)
    .sort((a, b) => b.date - a.date);

  const ids = [...new Set(all.flatMap(w => w.exercises.map(e => e.exerciseId)))];
  const exs = await getExercisesByIds(ids);
  const exerciseMap = {};
  exs.forEach(e => { exerciseMap[e.id] = e; });

  return { workouts: all, exerciseMap };
}

export function useHistoryWorkout() {
  const [workouts, setWorkouts] = useState([]);
  const [exerciseMap, setExerciseMap] = useState({});

  const loadWorkouts = useCallback(async () => {
    const data = await getHistoryData();
    setWorkouts(data.workouts);
    setExerciseMap(data.exerciseMap);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getHistoryData();
      if (cancelled) return;
      setWorkouts(data.workouts);
      setExerciseMap(data.exerciseMap);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function deleteHistoryWorkout(id) {
    await deleteWorkout(id);
    await loadWorkouts();
  }

  async function finishHistoryWorkout(workout) {
    await saveWorkout(finishAllWorkoutSets(workout));
    await loadWorkouts();
  }

  return {
    workouts,
    exerciseMap,
    deleteHistoryWorkout,
    finishHistoryWorkout,
  };
}
