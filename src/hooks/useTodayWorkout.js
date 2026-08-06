import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { useTimer } from '../context/useTimer';
import { useModal } from './useModal';
import {
  WORKOUT_STATUS,
  applyUserChangeStatus,
  createPrefilledExercises,
  createWorkoutExercisesFromRoutine,
  finalizeWorkout,
  getWorkoutStatus,
  syncPrefilledExercises,
  syncWorkoutExercises,
} from '../utils/workoutSync';
import { buildTodayWorkout, getTodayWorkoutProgress } from '../utils/todayWorkoutView';

function getTodayDow() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

async function getRoutineForToday() {
  const dow = getTodayDow();
  const schedule = await db.weeklySchedule.where('dayOfWeek').equals(dow).first();
  if (!schedule?.routineId) return null;
  return db.routines.get(schedule.routineId);
}

async function getPreviousDataMap(routine) {
  const prevWorkouts = await db.workouts.where('finishedAt').above(0).reverse().toArray();
  const prevMap = {};

  for (const routineExercise of routine.exercises) {
    for (const workout of prevWorkouts) {
      const previousExercise = workout.exercises.find(ex => ex.exerciseId === routineExercise.exerciseId);
      if (previousExercise) {
        prevMap[routineExercise.exerciseId] = previousExercise;
        break;
      }
    }
  }

  return prevMap;
}

export function useTodayWorkout() {
  const { t } = useTranslation();
  const { modal, confirm } = useModal();
  const { startTimer } = useTimer();
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState(null);
  const [workoutData, setWorkoutData] = useState(null);
  const [exerciseInfoMap, setExerciseInfoMap] = useState({});
  const [previousDataMap, setPreviousDataMap] = useState({});
  const [showSaved, setShowSaved] = useState(false);
  const workoutRef = useRef(null);
  const writeQueue = useRef(Promise.resolve());
  const savedTimeout = useRef(null);

  const persistWorkout = useCallback(async (workout) => {
    workoutRef.current = workout;
    setWorkoutData(workout);

    const snapshot = structuredClone(workout);
    writeQueue.current = writeQueue.current.then(() => db.workouts.put(snapshot));
    await writeQueue.current;
  }, []);

  const updateWorkout = useCallback(async (workout) => {
    const updated = applyUserChangeStatus(workout, workoutRef.current?.status);
    await persistWorkout(updated);

    setShowSaved(true);
    clearTimeout(savedTimeout.current);
    savedTimeout.current = setTimeout(() => setShowSaved(false), 2000);
  }, [persistWorkout]);

  useEffect(() => {
    const load = async () => {
      const todayRoutine = await getRoutineForToday();
      if (!todayRoutine) {
        setLoading(false);
        return;
      }

      const exerciseIds = todayRoutine.exercises.map(ex => ex.exerciseId);
      const exercises = exerciseIds.length > 0
        ? await db.exercises.where('id').anyOf(exerciseIds).toArray()
        : [];
      const infoMap = {};
      exercises.forEach(ex => { infoMap[ex.id] = ex; });

      const prevMap = await getPreviousDataMap(todayRoutine);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const existing = await db.workouts
        .where('date')
        .aboveOrEqual(todayStart.getTime())
        .filter(workout => workout.routineId === todayRoutine.id)
        .first();

      let currentWorkout;
      if (existing) {
        currentWorkout = {
          ...existing,
          exercises: syncWorkoutExercises(todayRoutine.exercises, existing.exercises, prevMap),
          prefilledExercises: syncPrefilledExercises(
            todayRoutine.exercises,
            existing.prefilledExercises || existing.exercises,
            prevMap
          ),
        };
        currentWorkout.status = currentWorkout.status || getWorkoutStatus(currentWorkout);
        await db.workouts.put(currentWorkout);
      } else {
        const workoutExercises = createWorkoutExercisesFromRoutine(todayRoutine.exercises, prevMap);
        currentWorkout = {
          id: uuidv4(),
          date: Date.now(),
          routineId: todayRoutine.id,
          status: WORKOUT_STATUS.NOT_STARTED,
          exercises: workoutExercises,
          prefilledExercises: createPrefilledExercises(workoutExercises),
          finishedAt: null,
        };
        await db.workouts.add(currentWorkout);
      }

      setRoutine(todayRoutine);
      setExerciseInfoMap(infoMap);
      setPreviousDataMap(prevMap);
      workoutRef.current = currentWorkout;
      setWorkoutData(currentWorkout);
      setLoading(false);
    };

    load();
  }, []);

  const todayWorkout = useMemo(() => buildTodayWorkout({
    routine,
    workout: workoutData,
    exerciseInfoMap,
    dayOfWeek: getTodayDow(),
  }), [exerciseInfoMap, routine, workoutData]);

  const { totalSets, completedSets, progress } = useMemo(
    () => getTodayWorkoutProgress(todayWorkout),
    [todayWorkout]
  );

  const saveDisabled = !workoutData
    || workoutData.status === WORKOUT_STATUS.NOT_STARTED
    || workoutData.status === WORKOUT_STATUS.FINISHED;

  const saveButtonText = workoutData?.status === WORKOUT_STATUS.FINISHED
    ? t('today.savedWorkout')
    : t('today.saveWorkout');

  const handleSetChange = useCallback((exIdx, setIdx, field, value) => {
    const current = workoutRef.current;
    if (!current) return;

    const exercises = [...current.exercises];
    const sets = [...exercises[exIdx].sets];
    sets[setIdx] = {
      ...sets[setIdx],
      [field]: value === '' ? null : Number(value),
      completed: false,
    };
    exercises[exIdx] = { ...exercises[exIdx], sets };

    updateWorkout({ ...current, exercises });
  }, [updateWorkout]);

  const handleToggleComplete = useCallback((exIdx, setIdx) => {
    const current = workoutRef.current;
    if (!current) return;

    const exercises = [...current.exercises];
    const sets = [...exercises[exIdx].sets];
    const wasCompleted = sets[setIdx].completed;
    sets[setIdx] = { ...sets[setIdx], completed: !wasCompleted };
    exercises[exIdx] = { ...exercises[exIdx], sets };

    updateWorkout({ ...current, exercises });

    if (!wasCompleted && routine) {
      startTimer(routine.restTime ?? 60);
    }
  }, [routine, startTimer, updateWorkout]);

  const handleSaveWorkout = useCallback(async () => {
    if (saveDisabled) return;

    await persistWorkout(finalizeWorkout(workoutRef.current));
    setShowSaved(false);
  }, [persistWorkout, saveDisabled]);

  const handleResetWorkout = useCallback(async () => {
    if (!workoutRef.current || !routine) return;

    const ok = await confirm({
      title: t('today.resetWorkout'),
      message: t('today.confirmReset'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
    });
    if (!ok) return;

    const workoutExercises = createWorkoutExercisesFromRoutine(routine.exercises, previousDataMap);
    const newWorkout = {
      id: uuidv4(),
      date: Date.now(),
      routineId: routine.id,
      status: WORKOUT_STATUS.NOT_STARTED,
      exercises: workoutExercises,
      prefilledExercises: createPrefilledExercises(workoutExercises),
      finishedAt: null,
    };

    await db.workouts.delete(workoutRef.current.id);
    await db.workouts.add(newWorkout);
    workoutRef.current = newWorkout;
    setWorkoutData(newWorkout);
    setShowSaved(false);
  }, [confirm, previousDataMap, routine, t]);

  return {
    loading,
    modal,
    todayWorkout,
    totalSets,
    completedSets,
    progress,
    saveDisabled,
    saveButtonText,
    showSaved,
    handleSaveWorkout,
    handleSetChange,
    handleToggleComplete,
    handleResetWorkout,
  };
}
