import { useTranslation } from 'react-i18next';
import { useWeeklySchedule } from '../../hooks/useWeeklySchedule';

export default function WeeklySchedule({ routines }) {
  const { t } = useTranslation();
  const { schedule, changeScheduleRoutine } = useWeeklySchedule();

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