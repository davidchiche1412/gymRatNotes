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
