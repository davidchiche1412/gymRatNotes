import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../components/Modal';
import { useModal } from '../../hooks/useModal';
import RoutineEditor from './RoutineEditor';
import WeeklySchedule from './WeeklySchedule';
import { useRoutines } from '../../hooks/useRoutines';
import { fetchSharedRoutine } from '../../db/queries/sharedRoutines';
import { supabase } from '../../db/supabase';

export default function RoutinesPage() {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(null);
  const { modal, confirm } = useModal();
  const { routines, saveRoutine, deleteRoutine, importRoutine, shareRoutine } = useRoutines();
  const [sharedFeedback, setSharedFeedback] = useState({});
  const [importId, setImportId] = useState('');
  const [importFeedback, setImportFeedback] = useState(null);

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

  const handleShare = async (e, routine) => {
    e.stopPropagation();
    if (!supabase) {
      setSharedFeedback(prev => ({ ...prev, [routine.id]: t('routines.shareUnavailable') }));
      setTimeout(() => setSharedFeedback(prev => ({ ...prev, [routine.id]: null })), 2000);
      return;
    }
    try {
      const id = await shareRoutine(routine);
      await navigator.clipboard.writeText(id);
      setSharedFeedback(prev => ({ ...prev, [routine.id]: t('routines.idCopied') }));
    } catch {
      setSharedFeedback(prev => ({ ...prev, [routine.id]: t('routines.shareError') }));
    }
    setTimeout(() => setSharedFeedback(prev => ({ ...prev, [routine.id]: null })), 2000);
  };

  const handleImport = async () => {
    const trimmed = importId.trim();
    if (!trimmed) return;
    if (!supabase) {
      setImportFeedback(t('routines.shareUnavailable'));
      setTimeout(() => setImportFeedback(null), 2500);
      return;
    }
    try {
      const data = await fetchSharedRoutine(trimmed);
      if (!data) {
        setImportFeedback(t('routines.importError'));
      } else {
        await importRoutine(data);
        setImportFeedback(t('routines.importSuccess'));
        setImportId('');
      }
    } catch {
      setImportFeedback(t('routines.importError'));
    }
    setTimeout(() => setImportFeedback(null), 2500);
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleShare(e, r)}
                    className="text-xs p-1 hover:text-primary transition-colors"
                    title={t('routines.share')}
                  >
                    {sharedFeedback[r.id] ? (
                      <span className="text-xs text-success">{sharedFeedback[r.id]}</span>
                    ) : '📋'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                    className="text-danger/70 text-xs p-1 hover:text-danger transition-colors"
                  >
                    {t('routines.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Importador de rutinas */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={importId}
          onChange={(e) => setImportId(e.target.value)}
          placeholder={t('routines.importPlaceholder')}
          className="flex-1 px-3 py-2 bg-surface border border-border rounded-xl text-sm"
        />
        <button
          onClick={handleImport}
          className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-medium hover:bg-primary-dark transition-colors"
        >
          {t('routines.importRoutine')}
        </button>
      </div>
      {importFeedback && (
        <p className="text-xs text-center mt-1 text-text-secondary">{importFeedback}</p>
      )}

      <WeeklySchedule routines={routines} />
      <Modal {...modal} />
    </div>
  );
}
