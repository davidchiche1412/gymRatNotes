import { useState, useEffect, useRef } from 'react';

export default function DraggableExerciseList({ exercises, onReorder, onUpdate, onEdit, onRemove, t }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const itemRefs = useRef([]);
  const dragState = useRef({ from: null, over: null, active: false });
  const onReorderRef = useRef(onReorder);

  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

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
                <p className="text-sm font-medium truncate">{ex.displayName}</p>
                {ex.muscleGroup && (
                  <p className="text-[10px] text-text-secondary">
                    {t(`exercises.muscleGroups.${ex.muscleGroup}`)}
                  </p>
                )}
              </div>

              <button onClick={() => onEdit(i)} className="text-text-secondary text-sm ml-1">✎</button>
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
              {(ex.type === 'weight' || ex.type === 'bodyweight') && (
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
                    <span className="text-[10px] text-text-secondary mb-0.5">{t('routines.weightMode')}</span>
                    <select
                      value={ex.targetWeightMode || 'total'}
                      onChange={e => onUpdate(i, 'targetWeightMode', e.target.value)}
                      className="w-28 text-center px-1 py-1.5 rounded-lg border border-border bg-bg text-xs"
                    >
                      <option value="total">{t('routines.weightModes.total')}</option>
                      <option value="per_side">{t('routines.weightModes.per_side')}</option>
                      <option value="machine">{t('routines.weightModes.machine')}</option>
                    </select>
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
              {ex.type === 'timed' && (
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
            </div>
          </div>
        );
      })}
    </div>
  );
}