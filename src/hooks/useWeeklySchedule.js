import { useEffect, useState } from 'react';
import { getWeeklySchedule, updateScheduleRoutine } from '../db/queries/weeklySchedule';

export function useWeeklySchedule() {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const days = await getWeeklySchedule();
      if (!cancelled) setSchedule(days);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const changeScheduleRoutine = async (dayOfWeek, routineId) => {
    const day = schedule.find(s => s.dayOfWeek === dayOfWeek);
    if (!day) return;

    const nextRoutineId = routineId || null;
    await updateScheduleRoutine(day.id, nextRoutineId);
    setSchedule(prev => prev.map(s => (
      s.dayOfWeek === dayOfWeek ? { ...s, routineId: nextRoutineId } : s
    )));
  };

  return {
    schedule,
    changeScheduleRoutine,
  };
}
