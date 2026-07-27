import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../db/database';

const muscleGroups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core'];
const movementTypes = ['push', 'pull', 'legs', 'core'];

export default function ExerciseSelector({ onSelect, onClose }) {
  const { t, i18n } = useTranslation();
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [movementFilter, setMovementFilter] = useState('');

  useEffect(() => {
    db.exercises.toArray().then(setExercises);
  }, []);

  const filtered = exercises.filter(ex => {
    const name = i18n.language === 'en' && ex.nameEN ? ex.nameEN : ex.name;
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = !muscleFilter || ex.muscleGroup === muscleFilter;
    const matchMovement = !movementFilter || ex.movementType === movementFilter;
    return matchSearch && matchMuscle && matchMovement;
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-surface backdrop-blur-lg w-full max-w-lg max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col border-t border-border">
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">{t('workout.addExercise')}</h2>
            <button onClick={onClose} className="text-text-secondary text-2xl leading-none">&times;</button>
          </div>
          <input
            type="text"
            placeholder={t('exercises.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-white/50 text-sm"
          />
          <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setMuscleFilter('')}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-medium ${!muscleFilter ? 'bg-primary text-white' : 'bg-white/50'}`}
            >
              {t('exercises.all')}
            </button>
            {muscleGroups.map(mg => (
              <button
                key={mg}
                onClick={() => setMuscleFilter(muscleFilter === mg ? '' : mg)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-medium ${muscleFilter === mg ? 'bg-primary text-white' : 'bg-white/50'}`}
              >
                {t(`exercises.muscleGroups.${mg}`)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
            {movementTypes.map(mt => (
              <button
                key={mt}
                onClick={() => setMovementFilter(movementFilter === mt ? '' : mt)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-medium ${movementFilter === mt ? 'bg-primary text-white' : 'bg-white/50'}`}
              >
                {t(`exercises.movementTypes.${mt}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-text-secondary py-8">{t('exercises.noResults')}</p>
          ) : (
            filtered.map(ex => (
              <button
                key={ex.id}
                onClick={() => onSelect(ex)}
                className="w-full text-left px-4 py-3 hover:bg-bg:bg-bg-dark rounded-lg transition-colors"
              >
                <div className="font-medium text-sm">
                  {i18n.language === 'en' && ex.nameEN ? ex.nameEN : ex.name}
                </div>
                <div className="text-xs text-text-secondary">
                  {t(`exercises.muscleGroups.${ex.muscleGroup}`)} · {t(`exercises.types.${ex.type}`)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
