import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';

const WorkoutContext = createContext();

export function WorkoutProvider({ children }) {
  const [activeWorkout, setActiveWorkout] = useState(null);

  // Restore active workout from DB on mount
  useEffect(() => {
    db.workouts
      .filter(w => w.finishedAt === null)
      .first()
      .then(w => {
        if (w) setActiveWorkout(w);
      });
  }, []);

  const startWorkout = async (routineId = null, exercises = []) => {
    const workout = {
      id: uuidv4(),
      date: Date.now(),
      routineId,
      exercises: exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        notes: null,
        sets: Array.from({ length: ex.targetSets || 1 }, () => ({
          weight: null,
          reps: null,
          duration: null,
          completed: false,
        })),
      })),
      finishedAt: null,
    };
    await db.workouts.add(workout);
    setActiveWorkout(workout);
    return workout;
  };

  const updateWorkout = async (updated) => {
    setActiveWorkout(updated);
    await db.workouts.put(updated);
  };

  const addExerciseToWorkout = async (exerciseId) => {
    if (!activeWorkout) return;
    const updated = {
      ...activeWorkout,
      exercises: [
        ...activeWorkout.exercises,
        {
          exerciseId,
          notes: null,
          sets: [{ weight: null, reps: null, duration: null, completed: false }],
        },
      ],
    };
    await updateWorkout(updated);
  };

  const updateExerciseSets = async (exerciseIndex, sets) => {
    if (!activeWorkout) return;
    const exercises = [...activeWorkout.exercises];
    exercises[exerciseIndex] = { ...exercises[exerciseIndex], sets };
    await updateWorkout({ ...activeWorkout, exercises });
  };

  const updateExerciseNotes = async (exerciseIndex, notes) => {
    if (!activeWorkout) return;
    const exercises = [...activeWorkout.exercises];
    exercises[exerciseIndex] = { ...exercises[exerciseIndex], notes };
    await updateWorkout({ ...activeWorkout, exercises });
  };

  const removeExerciseFromWorkout = async (exerciseIndex) => {
    if (!activeWorkout) return;
    const exercises = activeWorkout.exercises.filter((_, i) => i !== exerciseIndex);
    await updateWorkout({ ...activeWorkout, exercises });
  };

  const finishWorkout = async () => {
    if (!activeWorkout) return;
    const finished = { ...activeWorkout, finishedAt: Date.now() };
    await db.workouts.put(finished);
    setActiveWorkout(null);
  };

  const cancelWorkout = async () => {
    if (!activeWorkout) return;
    await db.workouts.delete(activeWorkout.id);
    setActiveWorkout(null);
  };

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        startWorkout,
        addExerciseToWorkout,
        updateExerciseSets,
        updateExerciseNotes,
        removeExerciseFromWorkout,
        finishWorkout,
        cancelWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export const useWorkout = () => useContext(WorkoutContext);
