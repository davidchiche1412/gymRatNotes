import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';
import RoutineEditor from './RoutineEditor';
import WeeklySchedule from './WeeklySchedule';
import { useRoutines } from '../../hooks/useRoutines';

export default function RoutinesPage() {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(null);
  const { modal, confirm } = useModal();
  const { routines, saveRoutine, deleteRoutine } = useRoutines();

  // Manejo del botón atrás para salir del editor
  useEffect(() => {
    if (!editing) return;
    window.history.pushState({ editing: true }, '');
    const handlePopState = () => {
      setEditing(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [editing]);

  const handleSave = async ({ name, exercises, restTime }) => {
    await saveRoutine(editing, { name, exercises, restTime });
    setEditing(null);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: t('routines.deleteRoutine'),
      message: t('routines.confirmDelete'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
    });
    if (!ok) return;
    await deleteRoutine(id);
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
          className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-medium hover:bg-primary-dark transition-colors"
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
              className="bg-surface rounded-xl p-4 border border-border active:scale-[0.98] transition-all cursor-pointer hover:border-primary/40"
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
                  className="text-danger/70 text-xs p-1 hover:text-danger transition-colors"
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
