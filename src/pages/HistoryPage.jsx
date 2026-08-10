import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';
import { WORKOUT_STATUS, getWorkoutStatus } from '../utils/workoutSync';
import { useHistoryWorkout } from '../hooks/useHistoryWorkout';
import { getExerciseNameById } from '../utils/exerciseName';

export default function HistoryPage() {
  const { t, i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState(null);
  const { modal, confirm } = useModal();
  const { workouts, exerciseMap, deleteHistoryWorkout, finishHistoryWorkout } = useHistoryWorkout();

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: t('history.deleteWorkout'),
      message: t('history.confirmDelete'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
    });
    if (!ok) return;
    await deleteHistoryWorkout(id);
  };

  const handleFinishWorkout = async (workout) => {
    await finishHistoryWorkout(workout);
  };

  const formatDate = (ts) => {
    return new Date(ts).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getMuscleGroups = (workout) => {
    const groups = new Set();
    workout.exercises.forEach(e => {
      const ex = exerciseMap[e.exerciseId];
      if (ex) groups.add(t(`exercises.muscleGroups.${ex.muscleGroup}`));
    });
    return [...groups].join(', ');
  };

  const getStatusBadge = (workout) => {
    const status = getWorkoutStatus(workout);
    if (status === WORKOUT_STATUS.FINISHED) return { text: t('history.statusFinished'), className: 'text-green-500 bg-green-500/10' };
    if (status === WORKOUT_STATUS.IN_PROGRESS) return { text: t('history.statusInProgress'), className: 'text-primary bg-primary/10' };
    return { text: t('history.statusDraft'), className: 'text-warning bg-warning/10' };
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">{t('history.title')}</h1>

      {workouts.length === 0 ? (
        <p className="text-center text-text-secondary py-12 text-sm">
          {t('history.noWorkouts')}
        </p>
      ) : (
        <div className="space-y-2">
          {workouts.map(w => {
            const badge = getStatusBadge(w);
            const status = getWorkoutStatus(w);
            return (
            <div key={w.id} className="bg-surface rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                className="w-full p-3 text-left"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{formatDate(w.date)}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t('history.exercises', { count: w.exercises.length })}
                    </p>
                    <p className="text-xs text-primary mt-0.5">{getMuscleGroups(w)}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.className}`}>
                      {badge.text}
                    </span>
                  </div>
                  <span className="text-text-secondary text-xs">{expandedId === w.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {expandedId === w.id && (
                <div className="px-3 pb-3 border-t border-border pt-2">
                  {w.exercises.map((ex, i) => (
                    <div key={i} className="mb-2">
                      <p className="font-medium text-sm">{getExerciseNameById(exerciseMap, ex.exerciseId, i18n.language)}</p>
                      <div className="mt-0.5 space-y-0.5">
                        {ex.sets.map((s, si) => (
                          <p key={si} className="text-xs text-text-secondary">
                            {t('workout.set')} {si + 1}:{' '}
                            {s.weight != null && `${s.weight} kg`}
                            {s.weight != null && s.reps != null && ' × '}
                            {s.reps != null && `${s.reps} reps`}
                            {s.duration != null && `${s.duration}s`}
                            {s.completed && ' ✓'}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                  {status !== WORKOUT_STATUS.FINISHED && (
                    <button
                      onClick={() => handleFinishWorkout(w)}
                      className="text-primary text-xs mt-2 mr-3"
                    >
                      {t('history.finishWorkout')}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="text-danger text-xs mt-2"
                  >
                    {t('history.deleteWorkout')}
                  </button>
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}
      <Modal {...modal} />
    </div>
  );
}
