import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import ExerciseSelector from '../components/ExerciseSelector';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';

function DraggableExerciseList({ exercises, exerciseInfoMap, getExName, onReorder, onUpdate, onRemove, t }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const itemRefs = useRef([]);
  const dragState = useRef({ from: null, over: null, active: false });
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  useEffect(() => {
    const onMove = (e) => {
      if (!dragState.current.active) return;
      const y = e.clientY;
      for (let i = 0; i < itemRefs.current.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) {
          if (dragState.current.over !== i) {
            dragState.current.over = i;
            setOverIdx(i);
          }
          break;
        }
      }
    };

    const onUp = () => {
      if (!dragState.current.active) return;
      const { from, over } = dragState.current;
      dragState.current.active = false;
      if (from !== null && over !== null && from !== over) {
        onReorderRef.current(from, over);
      }
      dragState.current.from = null;
      dragState.current.over = null;
      setDragIdx(null);
      setOverIdx(null);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const handlePointerDown = (e, idx) => {
    e.preventDefault();
    dragState.current = { from: idx, over: idx, active: true };
    setDragIdx(idx);
    setOverIdx(idx);
  };

  return (
    <div className="space-y-2">
      {exercises.map((ex, i) => {
        const exInfo = exerciseInfoMap[ex.exerciseId];
        const isDragging = dragIdx === i;
        const isOver = overIdx === i && dragIdx !== null && dragIdx !== i;

        return (
          <div
            key={`${ex.exerciseId}-${i}`}
            ref={el => itemRefs.current[i] = el}
            className={`bg-surface rounded-xl p-3 border-2 transition-all duration-150 ${
              isDragging ? 'border-primary opacity-50 scale-[0.96]' :
              isOver ? 'border-primary bg-primary/10 scale-[1.02]' :
              'border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              {/* Drag handle */}
              <div
                onPointerDown={e => handlePointerDown(e, i)}
                className="flex flex-col items-center justify-center w-8 h-8 cursor-grab active:cursor-grabbing touch-none select-none rounded-lg hover:bg-border/50"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-text-secondary">
                  <circle cx="5" cy="3" r="1.5"/>
                  <circle cx="11" cy="3" r="1.5"/>
                  <circle cx="5" cy="8" r="1.5"/>
                  <circle cx="11" cy="8" r="1.5"/>
                  <circle cx="5" cy="13" r="1.5"/>
                  <circle cx="11" cy="13" r="1.5"/>
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{getExName(ex.exerciseId)}</p>
                {exInfo && (
                  <p className="text-[10px] text-text-secondary">
                    {t(`exercises.muscleGroups.${exInfo.muscleGroup}`)}
                  </p>
                )}
              </div>

              <button onClick={() => onRemove(i)} className="text-danger/70 text-sm ml-1">✕</button>
            </div>

            {/* Series, peso, reps y descanso */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-text-secondary mb-0.5">{t('routines.targetSets')}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={ex.targetSets}
                  onChange={e => onUpdate(i, 'targetSets', Number(e.target.value) || 1)}
                  className="w-14 text-center px-1 py-1.5 rounded-lg border border-border bg-bg text-sm"
                  min={1}
                />
              </div>
              {(exInfo?.type === 'weight' || exInfo?.type === 'bodyweight') && (
                <>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-text-secondary mb-0.5">{t('workout.weight')}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="—"
                      value={ex.targetWeight ?? ''}
                      onChange={e => onUpdate(i, 'targetWeight', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-16 text-center px-1 py-1.5 rounded-lg border border-border bg-bg text-sm"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-text-secondary mb-0.5">{t('workout.reps')}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="—"
                      value={ex.targetReps ?? ''}
                      onChange={e => onUpdate(i, 'targetReps', e.target.value === '' ? null : Number(e.target.value))}
                      className="w-16 text-center px-1 py-1.5 rounded-lg border border-border bg-bg text-sm"
                    />
                  </div>
                </>
              )}
              {exInfo?.type === 'timed' && (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-text-secondary mb-0.5">{t('workout.duration')}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="—"
                    value={ex.targetDuration ?? ''}
                    onChange={e => onUpdate(i, 'targetDuration', e.target.value === '' ? null : Number(e.target.value))}
                    className="w-16 text-center px-1 py-1.5 rounded-lg border border-border bg-bg text-sm"
                  />
                </div>
              )}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-text-secondary mb-0.5">{t('routines.restTime')}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="60"
                  value={ex.restTime ?? ''}
                  onChange={e => onUpdate(i, 'restTime', e.target.value === '' ? null : Number(e.target.value))}
                  className="w-14 text-center px-1 py-1.5 rounded-lg border border-border bg-bg text-sm"
                  min={0}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RoutineEditor({ routine, onSave, onCancel }) {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState(routine?.name || '');
  const [exercises, setExercises] = useState(routine?.exercises || []);
  const [showSelector, setShowSelector] = useState(false);
  const [exerciseInfoMap, setExerciseInfoMap] = useState({});

  useEffect(() => {
    const ids = exercises.map(e => e.exerciseId);
    if (ids.length > 0) {
      db.exercises.where('id').anyOf(ids).toArray().then(exs => {
        const map = {};
        exs.forEach(e => { map[e.id] = e; });
        setExerciseInfoMap(map);
      });
    }
  }, [exercises.length]);

  const handleAddExercise = (exercise) => {
    setExercises([...exercises, {
      exerciseId: exercise.id,
      targetSets: 3,
      targetWeight: null,
      targetReps: null,
      targetDuration: null,
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
    onSave({ name: name.trim(), exercises });
  };

  const getExName = (id) => {
    const ex = exerciseInfoMap[id];
    if (!ex) return '...';
    return i18n.language === 'en' && ex.nameEN ? ex.nameEN : ex.name;
  };

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
        className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm mb-4"
      />

      <DraggableExerciseList
        exercises={exercises}
        exerciseInfoMap={exerciseInfoMap}
        getExName={getExName}
        onReorder={handleReorder}
        onUpdate={handleUpdateExercise}
        onRemove={handleRemoveExercise}
        t={t}
      />

      <button
        onClick={() => setShowSelector(true)}
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
          onSelect={handleAddExercise}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
}

function WeeklySchedule({ routines }) {
  const { t } = useTranslation();
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    db.weeklySchedule.orderBy('dayOfWeek').toArray().then(setSchedule);
  }, []);

  const handleChange = async (dayOfWeek, routineId) => {
    const day = schedule.find(s => s.dayOfWeek === dayOfWeek);
    if (day) {
      await db.weeklySchedule.update(day.id, { routineId: routineId || null });
      setSchedule(prev => prev.map(s => s.dayOfWeek === dayOfWeek ? { ...s, routineId: routineId || null } : s));
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3">{t('routines.weeklySchedule')}</h2>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5, 6].map(day => {
          const daySchedule = schedule.find(s => s.dayOfWeek === day);
          return (
            <div key={day} className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border">
              <span className="text-sm font-medium w-20">{t(`days.${day}`)}</span>
              <select
                value={daySchedule?.routineId || ''}
                onChange={e => handleChange(day, e.target.value)}
                className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-bg text-sm"
              >
                <option value="">{t('routines.noRoutineAssigned')}</option>
                {routines.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RoutinesPage() {
  const { t } = useTranslation();
  const [routines, setRoutines] = useState([]);
  const [editing, setEditing] = useState(null);
  const { modal, confirm } = useModal();

  const loadRoutines = async () => {
    const all = await db.routines.toArray();
    setRoutines(all);
  };

  useEffect(() => { loadRoutines(); }, []);

  const handleSave = async ({ name, exercises }) => {
    if (editing === 'new') {
      await db.routines.add({
        id: uuidv4(),
        name,
        exercises,
        updatedAt: Date.now(),
      });
    } else {
      await db.routines.update(editing, { name, exercises, updatedAt: Date.now() });
    }
    setEditing(null);
    loadRoutines();
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: t('routines.deleteRoutine'),
      message: t('routines.confirmDelete'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
    });
    if (!ok) return;
    await db.routines.delete(id);
    // Also remove from weekly schedule
    const schedules = await db.weeklySchedule.where('routineId').equals(id).toArray();
    for (const s of schedules) {
      await db.weeklySchedule.update(s.id, { routineId: null });
    }
    loadRoutines();
  };

  if (editing) {
    const routine = editing === 'new' ? null : routines.find(r => r.id === editing);
    return (
      <RoutineEditor
        routine={routine}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">{t('routines.title')}</h1>
        <button
          onClick={() => setEditing('new')}
          className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-medium"
        >
          + {t('routines.create')}
        </button>
      </div>

      {routines.length === 0 ? (
        <p className="text-center text-text-secondary py-12">
          {t('routines.noRoutines')}
        </p>
      ) : (
        <div className="space-y-3">
          {routines.map(r => (
            <div
              key={r.id}
              onClick={() => setEditing(r.id)}
              className="bg-surface rounded-xl p-4 border border-border active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {r.exercises.length} {t('routines.exercises')}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                  className="text-danger/70 text-xs p-1"
                >
                  {t('routines.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <WeeklySchedule routines={routines} />
      <Modal {...modal} />
    </div>
  );
}
