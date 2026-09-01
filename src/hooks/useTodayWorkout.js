import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { useTimer } from '../context/useTimer';
import { useModal } from './useModal';
import { getExercisesByIds } from '../db/queries/exercises';
import { getRoutine } from '../db/queries/routines';
import { getScheduleForDay } from '../db/queries/weeklySchedule';
import {
  addWorkout,
  deleteWorkout,

  getFinishedWorkoutsByRoutine,
  getWorkoutForRoutineSince,
  saveWorkout,
  finalizePastWorkouts,
} from '../db/queries/workouts';
import {
  WORKOUT_STATUS,
  applyUserChangeStatus,
  createWorkoutFromRoutine,
  finalizeWorkout,
  syncWorkoutWithRoutine,
  toggleWorkoutSetCompleted,
  updateWorkoutSetValue,
} from '../utils/workoutSync';
import { buildTodayWorkout, getTodayWorkoutProgress } from '../utils/todayWorkoutView';

function getTodayDow() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

async function getRoutineForToday() {
  const dow = getTodayDow();
  const schedule = await getScheduleForDay(dow);
  if (!schedule?.routineId) return null;
  return getRoutine(schedule.routineId);
}

async function getPreviousDataMap(routine) {
  // Solo workouts de esta rutina, ya ordenados por fecha desc
  const prevWorkouts = await getFinishedWorkoutsByRoutine(routine.id);
  if (prevWorkouts.length === 0) return {};

  const prevMap = {};
  const needed = new Set(routine.exercises.map(ex => ex.exerciseId));

  // Un solo paso por los workouts: O(workouts × exercises del workout)
  for (const workout of prevWorkouts) {
    if (needed.size === 0) break;
    for (const ex of workout.exercises) {
      if (needed.has(ex.exerciseId)) {
        prevMap[ex.exerciseId] = ex;
        needed.delete(ex.exerciseId);
      }
    }
  }

  return prevMap;
}

async function getExerciseInfoMap(routine) {
  const exerciseIds = routine.exercises.map(ex => ex.exerciseId);
  const exercises = await getExercisesByIds(exerciseIds);

  const infoMap = {};
  exercises.forEach(ex => { infoMap[ex.id] = ex; });
  return infoMap;
}

async function getExistingWorkoutForToday(routine) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return getWorkoutForRoutineSince(routine.id, todayStart.getTime());
}

async function loadTodayWorkoutData() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  await finalizePastWorkouts(todayStart.getTime());

  const routine = await getRoutineForToday();
  if (!routine) return null;

  const [exerciseInfoMap, previousDataMap] = await Promise.all([
    getExerciseInfoMap(routine),
    getPreviousDataMap(routine),
  ]);
  const existing = await getExistingWorkoutForToday(routine);
  const workout = existing
    ? syncWorkoutWithRoutine(routine, existing, previousDataMap)
    : createWorkoutFromRoutine(routine, previousDataMap, uuidv4(), Date.now());

  if (existing) {
    await saveWorkout(workout);
  } else {
    await addWorkout(workout);
  }

  return {
    routine,
    exerciseInfoMap,
    previousDataMap,
    workout,
  };
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
    writeQueue.current = writeQueue.current.then(() => saveWorkout(snapshot));
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
    let cancelled = false;

    const load = async () => {
      const data = await loadTodayWorkoutData();
      if (cancelled) return;

      if (!data) {
        setLoading(false);
        return;
      }

      setRoutine(data.routine);
      setExerciseInfoMap(data.exerciseInfoMap);
      setPreviousDataMap(data.previousDataMap);
      workoutRef.current = data.workout;
      setWorkoutData(data.workout);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
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

    updateWorkout(updateWorkoutSetValue(current, exIdx, setIdx, field, value));
  }, [updateWorkout]);

  const handleToggleComplete = useCallback((exIdx, setIdx) => {
    const current = workoutRef.current;
    if (!current) return;

    const wasCompleted = current.exercises[exIdx].sets[setIdx].completed;

    updateWorkout(toggleWorkoutSetCompleted(current, exIdx, setIdx));

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

    const newWorkout = createWorkoutFromRoutine(routine, previousDataMap, uuidv4(), Date.now());

    await deleteWorkout(workoutRef.current.id);
    await addWorkout(newWorkout);
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
