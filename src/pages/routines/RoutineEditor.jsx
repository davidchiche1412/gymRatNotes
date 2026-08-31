import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ExerciseSelector from '../../components/ExerciseSelector';
import DraggableExerciseList from '../../components/DraggableExerciseList';
import { getExerciseName } from '../../utils/exerciseName';
import { useExerciseInfoMap } from '../../hooks/useExerciseInfoMap';
import { getFinishedWorkouts } from '../../db/queries/workouts';

function buildTargetsForType(type, previousExercise = null) {
  if (type === 'timed') {
    return {
      targetWeight: null,
      targetReps: null,
      targetDuration: previousExercise?.targetDuration ?? null,
      targetWeightMode: null,
    };
  }

  return {
    targetWeight: previousExercise?.targetWeight ?? null,
    targetReps: previousExercise?.targetReps ?? null,
    targetDuration: null,
    targetWeightMode: previousExercise?.targetWeightMode ?? 'total',
  };
}

export default function RoutineEditor({ routine, onSave, onCancel }) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState(routine?.name || '');
  const [exercises, setExercises] = useState(routine?.exercises || []);
  const [restTime, setRestTime] = useState(routine?.restTime ?? 60);
  const [showSelector, setShowSelector] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [expanded1RM, setExpanded1RM] = useState({});
  const exerciseInfoMap = useExerciseInfoMap(exercises);

  useEffect(() => {
    getFinishedWorkouts().then(setWorkouts);
  }, []);

  const handleSelectExercise = (exercise) => {
    if (editingExerciseIndex !== null) {
      setExercises(current => {
        const updated = [...current];
        const previousExercise = updated[editingExerciseIndex];
        updated[editingExerciseIndex] = {
          ...previousExercise,
          exerciseId: exercise.id,
          ...buildTargetsForType(exercise.type, previousExercise),
        };
        return updated;
      });
      setEditingExerciseIndex(null);
      setShowSelector(false);
      return;
    }

    setExercises([...exercises, {
      exerciseId: exercise.id,
      targetSets: 3,
      ...buildTargetsForType(exercise.type),
    }]);
    setShowSelector(false);
  };

  const handleRemoveExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleReorder = (fromIdx, toIdx) => {
    const updated = [...exercises];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setExercises(updated);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), exercises, restTime });
  };

  const exerciseItems = useMemo(() => exercises.map(ex => {
    const info = exerciseInfoMap[ex.exerciseId];
    return {
      ...ex,
      displayName: getExerciseName(info, i18n.language, '...'),
      muscleGroup: info?.muscleGroup,
      type: info?.type,
    };
  }), [exerciseInfoMap, exercises, i18n.language]);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold">{routine ? t('routines.edit') : t('routines.create')}</h1>
        <button onClick={onCancel} className="text-text-secondary text-sm">{t('common.cancel')}</button>
      </div>

      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={t('routines.name')}
        className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm mb-3"
      />

      {/* Descanso global */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <span className="text-sm text-text-secondary">⏱ {t('routines.restTimeBetweenSets')}</span>
        <input
          type="number"
          inputMode="numeric"
          value={restTime}
          onChange={e => setRestTime(Number(e.target.value) || 0)}
          className="w-16 text-center px-2 py-1.5 rounded-lg border border-border bg-bg text-sm"
          min={0}
        />
        <span className="text-xs text-text-secondary">s</span>
      </div>

      <DraggableExerciseList
        exercises={exerciseItems}
        onReorder={handleReorder}
        onUpdate={handleUpdateExercise}
        onEdit={(index) => {
          setEditingExerciseIndex(index);
          setShowSelector(true);
        }}
        onRemove={handleRemoveExercise}
        workouts={workouts}
        expanded1RM={expanded1RM}
        onToggle1RM={(id) => setExpanded1RM(prev => ({ ...prev, [id]: !prev[id] }))}
        t={t}
      />

      <button
        onClick={() => {
          setEditingExerciseIndex(null);
          setShowSelector(true);
        }}
        className="w-full mt-3 py-2 border-2 border-dashed border-primary/30 text-primary rounded-xl text-sm font-medium"
      >
        + {t('routines.addExercise')}
      </button>

      <button
        onClick={handleSave}
        className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-semibold"
      >
        {t('routines.save')}
      </button>

      {showSelector && (
        <ExerciseSelector
          onSelect={handleSelectExercise}
          onClose={() => {
            setShowSelector(false);
            setEditingExerciseIndex(null);
          }}
        />
      )}
    </div>
  );
}