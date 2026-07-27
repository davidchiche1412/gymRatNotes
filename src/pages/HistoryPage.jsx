import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../db/database';

export default function HistoryPage() {
  const { t, i18n } = useTranslation();
  const [workouts, setWorkouts] = useState([]);
  const [exerciseMap, setExerciseMap] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const loadWorkouts = async () => {
    const all = await db.workouts
      .where('finishedAt')
      .above(0)
      .reverse()
      .sortBy('date');
    setWorkouts(all.sort((a, b) => b.date - a.date));

    const ids = [...new Set(all.flatMap(w => w.exercises.map(e => e.exerciseId)))];
    if (ids.length > 0) {
      const exs = await db.exercises.where('id').anyOf(ids).toArray();
      const map = {};
      exs.forEach(e => { map[e.id] = e; });
      setExerciseMap(map);
    }
  };

  useEffect(() => { loadWorkouts(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm(t('history.confirmDelete'))) return;
    await db.workouts.delete(id);
    loadWorkouts();
  };

  const formatDate = (ts) => {
    return new Date(ts).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getExName = (id) => {
    const ex = exerciseMap[id];
    if (!ex) return '...';
    return i18n.language === 'en' && ex.nameEN ? ex.nameEN : ex.name;
  };

  const getMuscleGroups = (workout) => {
    const groups = new Set();
    workout.exercises.forEach(e => {
      const ex = exerciseMap[e.exerciseId];
      if (ex) groups.add(t(`exercises.muscleGroups.${ex.muscleGroup}`));
    });
    return [...groups].join(', ');
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
          {workouts.map(w => (
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
                  </div>
                  <span className="text-text-secondary text-xs">{expandedId === w.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {expandedId === w.id && (
                <div className="px-3 pb-3 border-t border-border pt-2">
                  {w.exercises.map((ex, i) => (
                    <div key={i} className="mb-2">
                      <p className="font-medium text-sm">{getExName(ex.exerciseId)}</p>
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
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="text-danger text-xs mt-1"
                  >
                    {t('history.deleteWorkout')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
