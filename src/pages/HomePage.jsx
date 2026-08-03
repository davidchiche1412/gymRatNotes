import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';
import { useTimer } from '../context/useTimer';
import { applyAutoFinishedAt, createSetsFromRoutineExercise, syncWorkoutExercises } from '../utils/workoutSync';

// Día de la semana: 0=Lunes ... 6=Domingo (ISO)
function getTodayDow() {
  const jsDay = new Date().getDay(); // 0=Dom, 1=Lun...
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { modal, confirm } = useModal();
  const { startTimer } = useTimer();
  const [routine, setRoutine] = useState(null);
  const [exerciseInfoMap, setExerciseInfoMap] = useState({});
  const [workoutData, setWorkoutData] = useState(null);
  const [previousDataMap, setPreviousDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeout = useRef(null);

  const getExName = useCallback((ex) => {
    if (!ex) return '';
    return i18n.language === 'en' && ex.nameEN ? ex.nameEN : ex.name;
  }, [i18n.language]);

  // Cargar rutina del día, info de ejercicios y datos anteriores
  useEffect(() => {
    const load = async () => {
      const dow = getTodayDow();
      const schedule = await db.weeklySchedule.where('dayOfWeek').equals(dow).first();

      if (!schedule?.routineId) {
        setLoading(false);
        return;
      }

      const r = await db.routines.get(schedule.routineId);
      if (!r) { setLoading(false); return; }
      setRoutine(r);

      // Cargar info de ejercicios
      const ids = r.exercises.map(e => e.exerciseId);
      const exs = ids.length > 0 ? await db.exercises.where('id').anyOf(ids).toArray() : [];
      const map = {};
      exs.forEach(e => { map[e.id] = e; });
      setExerciseInfoMap(map);

      // Cargar datos anteriores (último workout finalizado que contenga cada ejercicio)
      const prevWorkouts = await db.workouts.where('finishedAt').above(0).reverse().toArray();
      const prevMap = {};
      for (const ex of r.exercises) {
        for (const pw of prevWorkouts) {
          const prevEx = pw.exercises.find(e => e.exerciseId === ex.exerciseId);
          if (prevEx) {
            prevMap[ex.exerciseId] = prevEx;
            break;
          }
        }
      }
      setPreviousDataMap(prevMap);

      // Comprobar si ya hay un workout de hoy sin finalizar
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const existing = await db.workouts
        .where('date')
        .aboveOrEqual(todayStart.getTime())
        .filter(w => w.routineId === r.id)
        .first();

      if (existing) {
        const synced = applyAutoFinishedAt({
          ...existing,
          exercises: syncWorkoutExercises(r.exercises, existing.exercises, prevMap),
        });
        await db.workouts.put(synced);
        setWorkoutData(synced);
      } else {
        // Crear workout pre-rellenado con datos anteriores
        const newWorkout = {
          id: uuidv4(),
          date: Date.now(),
          routineId: r.id,
          exercises: r.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            notes: null,
            sets: createSetsFromRoutineExercise(ex, prevMap[ex.exerciseId]),
          })),
          finishedAt: null,
        };
        await db.workouts.add(newWorkout);
        setWorkoutData(newWorkout);
      }
      setLoading(false);
    };
    load();
  }, []);

  const updateWorkout = async (updated) => {
    updated = applyAutoFinishedAt(updated);
    setWorkoutData(updated);
    await db.workouts.put(updated);
    // Feedback visual
    setShowSaved(true);
    clearTimeout(savedTimeout.current);
    savedTimeout.current = setTimeout(() => setShowSaved(false), 2000);
  };

  const handleSetChange = (exIdx, setIdx, field, value) => {
    if (!workoutData) return;
    const exercises = [...workoutData.exercises];
    const sets = [...exercises[exIdx].sets];
    sets[setIdx] = { ...sets[setIdx], [field]: value === '' ? null : Number(value) };
    exercises[exIdx] = { ...exercises[exIdx], sets };
    updateWorkout({ ...workoutData, exercises });
  };

  const handleToggleComplete = (exIdx, setIdx) => {
    if (!workoutData) return;
    const exercises = [...workoutData.exercises];
    const sets = [...exercises[exIdx].sets];
    const wasCompleted = sets[setIdx].completed;
    sets[setIdx] = { ...sets[setIdx], completed: !wasCompleted };
    exercises[exIdx] = { ...exercises[exIdx], sets };
    updateWorkout({ ...workoutData, exercises });

    // Iniciar timer al marcar como completada
    if (!wasCompleted && routine) {
      const restTime = routine.restTime ?? 60;
      startTimer(restTime);
    }
  };

  const handleResetWorkout = async () => {
    if (!workoutData) return;
    const ok = await confirm({
      title: t('today.resetWorkout'),
      message: t('today.confirmReset'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
    });
    if (!ok) return;
    await db.workouts.delete(workoutData.id);
    // Recrear workout limpio pre-rellenado
    const newWorkout = {
      id: uuidv4(),
      date: Date.now(),
      routineId: routine.id,
      exercises: routine.exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        notes: null,
        sets: createSetsFromRoutineExercise(ex, previousDataMap[ex.exerciseId]),
      })),
      finishedAt: null,
    };
    await db.workouts.add(newWorkout);
    setWorkoutData(newWorkout);
  };

  const totalSets = workoutData?.exercises?.reduce((sum, ex) => sum + ex.sets.length, 0) || 0;
  const completedSets = workoutData?.exercises?.reduce(
    (sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0
  ) || 0;
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Día de descanso
  if (!routine) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
        <span className="text-5xl mb-4">😴</span>
        <h1 className="text-xl font-bold mb-2">{t('today.restDay')}</h1>
        <p className="text-text-secondary text-sm">{t('today.restDayMessage')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-text-secondary">{t(`days.${getTodayDow()}`)}</p>
            <h1 className="text-lg font-bold">{routine.name}</h1>
          </div>
          <button
              onClick={handleResetWorkout}
              className="text-xs text-text-secondary px-2 py-1 hover:text-danger transition-colors"
            >
              {t('today.resetWorkout')}
            </button>
        </div>
        {/* Barra de progreso */}
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[11px] text-text-secondary mt-1">{completedSets}/{totalSets} series · {progress}%</p>
      </div>

      {/* Ejercicios */}
      <div className="px-3 pb-4 space-y-3">
        {workoutData?.exercises?.map((exData, exIdx) => {
          const exInfo = exerciseInfoMap[exData.exerciseId];
          const allCompleted = exData.sets.every(s => s.completed);

          return (
            <div
              key={exData.exerciseId}
              className={`rounded-xl border transition-all ${
                allCompleted
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-surface border-border'
              }`}
            >
              {/* Nombre del ejercicio */}
              <div className="px-4 pt-3 pb-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold text-sm ${allCompleted ? 'text-primary' : ''}`}>
                    {getExName(exInfo)}
                  </h3>
                  {allCompleted && <span className="text-primary text-xs">✓</span>}
                </div>
                <p className="text-[11px] text-text-secondary">
                  {exInfo && t(`exercises.muscleGroups.${exInfo.muscleGroup}`)}
                </p>
              </div>

              {/* Header de columnas */}
              <div className="flex items-center gap-2 px-4 py-1 text-[10px] text-text-secondary uppercase tracking-wider">
                <span className="w-6 text-center">#</span>
                {(exInfo?.type === 'weight' || exInfo?.type === 'bodyweight') && (
                  <>
                    <span className="flex-1 text-center">{t('workout.weight')}</span>
                    <span className="flex-1 text-center">{t('workout.reps')}</span>
                  </>
                )}
                {exInfo?.type === 'timed' && (
                  <span className="flex-1 text-center">{t('workout.duration')}</span>
                )}
                <span className="w-10"></span>
              </div>

              {/* Series */}
              <div className="px-4 pb-3 space-y-1">
                {exData.sets.map((set, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <span className={`text-[11px] w-6 text-center font-medium ${
                      set.completed ? 'text-primary' : 'text-text-secondary'
                    }`}>{si + 1}</span>

                    {(exInfo?.type === 'weight' || exInfo?.type === 'bodyweight') && (
                      <>
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="—"
                          value={set.weight ?? ''}
                          onChange={e => handleSetChange(exIdx, si, 'weight', e.target.value)}
                          
                          className={`flex-1 px-2 py-2 rounded-lg border text-sm text-center min-w-0 transition-colors ${
                            set.completed
                              ? 'bg-primary/10 border-primary/20 text-primary'
                              : 'bg-bg border-border'
                          }`}
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="—"
                          value={set.reps ?? ''}
                          onChange={e => handleSetChange(exIdx, si, 'reps', e.target.value)}
                          
                          className={`flex-1 px-2 py-2 rounded-lg border text-sm text-center min-w-0 transition-colors ${
                            set.completed
                              ? 'bg-primary/10 border-primary/20 text-primary'
                              : 'bg-bg border-border'
                          }`}
                        />
                      </>
                    )}
                    {exInfo?.type === 'timed' && (
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="—"
                        value={set.duration ?? ''}
                        onChange={e => handleSetChange(exIdx, si, 'duration', e.target.value)}
                        
                        className={`flex-1 px-2 py-2 rounded-lg border text-sm text-center min-w-0 transition-colors ${
                          set.completed
                            ? 'bg-primary/10 border-primary/20 text-primary'
                            : 'bg-bg border-border'
                        }`}
                      />
                    )}

                    <button
                      onClick={() => handleToggleComplete(exIdx, si)}
                      
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                        set.completed
                          ? 'bg-primary text-white hover:bg-primary-dark'
                          : 'bg-bg border border-border text-text-secondary hover:border-primary hover:text-primary'
                      } active:scale-95`}
                    >
                      ✓
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Indicador auto-guardado */}
        {showSaved && (
          <p className="text-center text-xs text-primary font-medium mt-3 animate-pulse">
            ✓ {t('today.autoSaved')}
          </p>
        )}
      </div>

      <Modal {...modal} />
    </div>
  );
}
