import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeeklySchedule } from '../../hooks/useWeeklySchedule';
import { serializeRoutineForSharing, encodeSchedule } from '../../utils/shareRoutine';
import { publishSchedule } from '../../db/queries/sharedRoutines';

export default function WeeklySchedule({ routines }) {
  const { t } = useTranslation();
  const { schedule, changeScheduleRoutine } = useWeeklySchedule();
  const [feedback, setFeedback] = useState(null);

  const handleShareSchedule = async () => {
    const sorted = [...schedule].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    const data = sorted.map(s => {
      const routine = routines.find(r => r.id === s.routineId);
      return {
        day: s.dayOfWeek,
        routine: routine ? serializeRoutineForSharing(routine) : null,
      };
    });

    try {
      const encoded = encodeSchedule(data);
      await navigator.clipboard.writeText(encoded);
      // Publicar en Supabase en segundo plano si está disponible
      publishSchedule(data).catch(() => {});
      setFeedback(t('routines.scheduleCopied'));
    } catch {
      setFeedback(t('routines.shareError'));
    }
    setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">{t('routines.weeklySchedule')}</h2>
        <button
          onClick={handleShareSchedule}
          className="text-xs px-2 py-1 text-text-secondary hover:text-primary transition-colors"
          title={t('routines.shareSchedule')}
        >
          {feedback || '\ud83d\udccb ' + t('routines.shareSchedule')}
        </button>
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5, 6].map(day => {
          const daySchedule = schedule.find(s => s.dayOfWeek === day);
          return (
            <div key={day} className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border">
              <span className="text-sm font-medium w-20">{t(`days.${day}`)}</span>
              <select
                value={daySchedule?.routineId || ''}
                onChange={e => changeScheduleRoutine(day, e.target.value)}
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
