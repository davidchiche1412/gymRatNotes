import { useEffect, useMemo, useState } from 'react';
import { getExercisesByIds } from '../db/queries/exercises';

export function useExerciseInfoMap(exercises) {
  const [exerciseInfoMap, setExerciseInfoMap] = useState({});

  // Dependencia estable: string de IDs ordenados
  const idsKey = useMemo(
    () => exercises.map(e => e.exerciseId).sort().join(','),
    [exercises]
  );

  useEffect(() => {
    if (!idsKey) {
      setExerciseInfoMap({});
      return;
    }
    let cancelled = false;

    const ids = idsKey.split(',');
    getExercisesByIds(ids).then(exs => {
      if (cancelled) return;
      const map = {};
      exs.forEach(e => { map[e.id] = e; });
      setExerciseInfoMap(map);
    });

    return () => { cancelled = true; };
  }, [idsKey]);

  return exerciseInfoMap;
}
