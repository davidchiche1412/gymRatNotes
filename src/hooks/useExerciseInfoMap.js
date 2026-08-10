import { useEffect, useState } from 'react';
import { getExercisesByIds } from '../db/queries/exercises';

export function useExerciseInfoMap(exercises) {
  const [exerciseInfoMap, setExerciseInfoMap] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const ids = exercises.map(e => e.exerciseId);
      if (ids.length === 0) {
        setExerciseInfoMap({});
        return;
      }

      const exs = await getExercisesByIds(ids);
      if (cancelled) return;

      const map = {};
      exs.forEach(e => { map[e.id] = e; });
      setExerciseInfoMap(map);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [exercises]);

  return exerciseInfoMap;
}
