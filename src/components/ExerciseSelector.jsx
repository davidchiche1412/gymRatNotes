import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { getExerciseName } from '../utils/exerciseName';
import { addExercise, getExercises } from '../db/queries/exercises';

const muscleGroups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'forearms', 'fullbody'];

export default function ExerciseSelector({ onSelect, onClose }) {
  const { t, i18n } = useTranslation();
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('chest');
  const [newType, setNewType] = useState('weight');

  const loadExercises = () => getExercises().then(setExercises);

  useEffect(() => { loadExercises(); }, []);

  const filtered = exercises.filter(ex => {
    const name = getExerciseName(ex, i18n.language);
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = !muscleFilter || ex.muscleGroup === muscleFilter;
    return matchSearch && matchMuscle;
  });

  const handleCreateExercise = async () => {
    if (!newName.trim()) return;
    const exercise = {
      id: uuidv4(),
      name: newName.trim(),
      nameEN: newName.trim(),
      type: newType,
      muscleGroup: newMuscle,
      movementType: newMuscle === 'core' ? 'core' : (newMuscle === 'legs' || newMuscle === 'glutes') ? 'legs' : 'push',
      isCustom: true,
    };
    await addExercise(exercise);
    await loadExercises();
    setShowCreate(false);
    setNewName('');
    onSelect(exercise);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-surface w-full max-w-lg max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col border-t border-border">
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
            className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-sm"
          />
          <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setMuscleFilter('')}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-medium ${!muscleFilter ? 'bg-primary text-white' : 'bg-bg border border-border'}`}
            >
              {t('exercises.all')}
            </button>
            {muscleGroups.map(mg => (
              <button
                key={mg}
                onClick={() => setMuscleFilter(muscleFilter === mg ? '' : mg)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-medium ${muscleFilter === mg ? 'bg-primary text-white' : 'bg-bg border border-border'}`}
              >
                {t(`exercises.muscleGroups.${mg}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {/* Botón crear ejercicio */}
          <button
            onClick={() => setShowCreate(true)}
            className="w-full text-left px-4 py-3 rounded-lg border-2 border-dashed border-primary/30 text-primary text-sm font-medium mb-2"
          >
            + {t('exercises.createCustom')}
          </button>

          {filtered.length === 0 ? (
            <p className="text-center text-text-secondary py-8">{t('exercises.noResults')}</p>
          ) : (
            filtered.map(ex => (
              <button
                key={ex.id}
                onClick={() => onSelect(ex)}
                className="w-full text-left px-4 py-3 rounded-lg active:bg-bg transition-colors"
              >
                <div className="font-medium text-sm flex items-center gap-2">
                  {getExerciseName(ex, i18n.language)}
                  {ex.isCustom && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{t('exercises.custom')}</span>}
                </div>
                <div className="text-xs text-text-secondary">
                  {t(`exercises.muscleGroups.${ex.muscleGroup}`)} · {t(`exercises.types.${ex.type}`)}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Modal crear ejercicio */}
        {showCreate && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 z-10 rounded-2xl">
            <div className="bg-surface border border-border rounded-2xl p-5 w-full max-w-sm animate-scale-in">
              <h3 className="font-bold mb-3">{t('exercises.createCustom')}</h3>
              <input
                type="text"
                placeholder={t('exercises.exerciseName')}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm mb-3"
                autoFocus
              />
              <div className="mb-3">
                <label className="text-xs text-text-secondary mb-1 block">{t('exercises.muscleGroupLabel')}</label>
                <select
                  value={newMuscle}
                  onChange={e => setNewMuscle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm"
                >
                  {muscleGroups.map(mg => (
                    <option key={mg} value={mg}>{t(`exercises.muscleGroups.${mg}`)}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="text-xs text-text-secondary mb-1 block">{t('exercises.typeLabel')}</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm"
                >
                  <option value="weight">{t('exercises.types.weight')}</option>
                  <option value="bodyweight">{t('exercises.types.bodyweight')}</option>
                  <option value="timed">{t('exercises.types.timed')}</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleCreateExercise}
                  disabled={!newName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
