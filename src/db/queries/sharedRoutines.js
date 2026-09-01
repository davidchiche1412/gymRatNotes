import { supabase } from '../supabase';

export async function publishRoutine(routineId, routineData) {
  if (!supabase) return null;
  const { error } = await supabase.from('shared_routines').insert({
    id: routineId,
    data: routineData,
    updated_at: Date.now(),
  });
  // Ignorar conflicto si ya fue compartida antes
  if (error && !error.message?.includes('duplicate')) throw error;
  return routineId;
}

export async function fetchSharedRoutine(routineId) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('shared_routines').select('*').eq('id', routineId).single();
  if (error) return null;
  return data?.data ?? null;
}

function generatePlanId() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return 'plan-' + hex;
}

export async function publishSchedule(scheduleData) {
  if (!supabase) return null;
  const id = generatePlanId();
  const { error } = await supabase.from('shared_schedules').insert({
    id,
    data: scheduleData,
    updated_at: Date.now(),
  });
  if (error && !error.message?.includes('duplicate')) throw error;
  return id;
}

export async function fetchSharedSchedule(planId) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('shared_schedules').select('*').eq('id', planId).single();
  if (error) return null;
  return data?.data ?? null;
}
