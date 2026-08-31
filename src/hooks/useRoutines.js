import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addRoutine, deleteRoutineAndClearSchedule, getRoutines, updateRoutine } from '../db/queries/routines';
import { publishRoutine } from '../db/queries/sharedRoutines';
import { serializeRoutineForSharing } from '../utils/shareRoutine';

export function useRoutines() {
  const [routines, setRoutines] = useState([]);

  const loadRoutines = useCallback(async () => {
    setRoutines(await getRoutines());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const all = await getRoutines();
      if (!cancelled) setRoutines(all);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveRoutine = async (editing, { name, exercises, restTime }) => {
    if (editing === 'new') {
      await addRoutine({
        id: uuidv4(),
        name,
        exercises,
        restTime,
        updatedAt: Date.now(),
      });
    } else {
      await updateRoutine(editing, { name, exercises, restTime, updatedAt: Date.now() });
    }

    await loadRoutines();
  };

  const deleteRoutine = async (id) => {
    await deleteRoutineAndClearSchedule(id);
    await loadRoutines();
  };

  const importRoutine = async (routineData) => {
    await addRoutine({
      id: uuidv4(),
      name: routineData.name,
      exercises: routineData.exercises,
      restTime: routineData.restTime,
      updatedAt: Date.now(),
    });
    await loadRoutines();
  };

  const shareRoutine = async (routine) => {
    const data = serializeRoutineForSharing(routine);
    await publishRoutine(routine.id, data);
    return routine.id;
  };

  return {
    routines,
    saveRoutine,
    deleteRoutine,
    importRoutine,
    shareRoutine,
  };
}
