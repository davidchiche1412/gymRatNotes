import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import DayOff from '../components/DayOff';
import Loading from '../components/Loading';
import { useTodayWorkout } from '../hooks/useTodayWorkout';
import { getExerciseName } from '../utils/exerciseName';
import { getWorkoutSetInputValue, getWorkoutSetPlaceholder, getWorkoutSetSuggestions } from '../utils/todayWorkoutView';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const {
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
  } = useTodayWorkout();

  const [focusedSet, setFocusedSet] = useState(null);

  if (loading) { return <Loading />; }

  if (!todayWorkout) { return <DayOff />; }

  return (
    <div className="max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-text-secondary">{t(`days.${todayWorkout.dayOfWeek}`)}</p>
            <h1 className="text-lg font-bold">{todayWorkout.routineName}</h1>
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
        {todayWorkout.exercises.map((exData, exIdx) => {
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
                    {getExerciseName(exData, i18n.language)}
                  </h3>
                  {allCompleted && <span className="text-primary text-xs">✓</span>}
                </div>
                <p className="text-[11px] text-text-secondary">
                  {exData.muscleGroup && t(`exercises.muscleGroups.${exData.muscleGroup}`)}
                  {(exData.type === 'weight' || exData.type === 'bodyweight') && (
                    <> · {t(`routines.weightModesShort.${exData.targetWeightMode || 'total'}`)}</>
                  )}
                </p>
              </div>

              {/* Header de columnas */}
              <div className="flex items-center gap-2 px-4 py-1 text-[10px] text-text-secondary uppercase tracking-wider">
                <span className="w-6 text-center">#</span>
                {(exData.type === 'weight' || exData.type === 'bodyweight') && (
                  <>
                    <span className="flex-1 text-center">{t('workout.weight')}</span>
                    <span className="flex-1 text-center">{t('workout.reps')}</span>
                  </>
                )}
                {exData.type === 'timed' && (
                  <span className="flex-1 text-center">{t('workout.duration')}</span>
                )}
                <span className="w-10"></span>
              </div>

              {/* Series */}
              <div className="px-4 pb-3 space-y-1">
                {exData.sets.map((set, si) => {
                  const isFocused = focusedSet?.exIdx === exIdx && focusedSet?.si === si;
                  const focusedField = isFocused ? focusedSet.field : null;
                  const suggestions = isFocused
                    ? getWorkoutSetSuggestions(exData.prefilledSets, exData.sets, si, focusedField)
                    : [];

                  return (
                    <div key={si} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] w-6 text-center font-medium ${
                          set.completed ? 'text-primary' : 'text-text-secondary'
                        }`}>{si + 1}</span>

                        {(exData.type === 'weight' || exData.type === 'bodyweight') && (
                          <>
                            <input
                              type="number"
                              inputMode="decimal"
                              placeholder={getWorkoutSetPlaceholder(exData.prefilledSets, exData.sets, si, 'weight')}
                              value={getWorkoutSetInputValue(todayWorkout.status, set, 'weight')}
                              onChange={e => handleSetChange(exIdx, si, 'weight', e.target.value)}
                              onFocus={() => setFocusedSet({ exIdx, si, field: 'weight' })}
                              onBlur={() => setTimeout(() => setFocusedSet(null), 150)}
                              className={`flex-1 px-2 py-2 rounded-lg border text-sm text-center min-w-0 transition-colors ${
                                set.completed
                                  ? 'bg-primary/10 border-primary/20 text-primary'
                                  : 'bg-bg border-border'
                              }`}
                            />
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder={getWorkoutSetPlaceholder(exData.prefilledSets, exData.sets, si, 'reps')}
                              value={getWorkoutSetInputValue(todayWorkout.status, set, 'reps')}
                              onChange={e => handleSetChange(exIdx, si, 'reps', e.target.value)}
                              onFocus={() => setFocusedSet({ exIdx, si, field: 'reps' })}
                              onBlur={() => setTimeout(() => setFocusedSet(null), 150)}
                              className={`flex-1 px-2 py-2 rounded-lg border text-sm text-center min-w-0 transition-colors ${
                                set.completed
                                  ? 'bg-primary/10 border-primary/20 text-primary'
                                  : 'bg-bg border-border'
                              }`}
                            />
                          </>
                        )}
                        {exData.type === 'timed' && (
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder={getWorkoutSetPlaceholder(exData.prefilledSets, exData.sets, si, 'duration')}
                            value={getWorkoutSetInputValue(todayWorkout.status, set, 'duration')}
                            onChange={e => handleSetChange(exIdx, si, 'duration', e.target.value)}
                            onFocus={() => setFocusedSet({ exIdx, si, field: 'duration' })}
                            onBlur={() => setTimeout(() => setFocusedSet(null), 150)}
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

                      {suggestions.length > 0 && (
                        <div className="flex gap-1 pl-8">
                          {suggestions.map((val, idx) => (
                            <button
                              key={idx}
                              onMouseDown={(e) => {
                                e.preventDefault(); // evita que el input pierda el foco
                                handleSetChange(exIdx, si, focusedField, String(val));
                              }}
                              className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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
        <button
          onClick={handleSaveWorkout}
          disabled={saveDisabled}
          className="w-full mt-3 py-3.5 bg-primary text-white rounded-xl text-base font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-40 disabled:hover:bg-primary"
        >
          {saveButtonText}
        </button>
      </div>

      <Modal {...modal} />
    </div>
  );
}
