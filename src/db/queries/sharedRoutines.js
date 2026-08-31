import { supabase } from '../supabase';

export async function publishRoutine(routineId, routineData) {
  if (!supabase) return null;
  const { error } = await supabase.from('shared_routines').upsert({
    id: routineId,
    data: routineData,
    updated_at: Date.now(),
  }, { onConflict: 'id' });
  if (error) throw error;
  return routineId;
}

export async function fetchSharedRoutine(routineId) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('shared_routines').select('*').eq('id', routineId).single();
  if (error) return null;
  return data?.data ?? null;
}

function generatePlanId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'plan-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export async function publishSchedule(scheduleData) {
  if (!supabase) return null;
  const id = generatePlanId();
  const { error } = await supabase.from('shared_schedules').upsert({
    id,
    data: scheduleData,
    updated_at: Date.now(),
  }, { onConflict: 'id' });
  if (error) throw error;
  return id;
}

export async function fetchSharedSchedule(planId) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('shared_schedules').select('*').eq('id', planId).single();
  if (error) return null;
  return data?.data ?? null;
}
