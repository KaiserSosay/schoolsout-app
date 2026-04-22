import { createServiceSupabase } from '@/lib/supabase/service';

export type Closure = {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
};

export async function getUpcomingClosures(schoolId: string, today: Date = new Date()): Promise<Closure[]> {
  const db = createServiceSupabase();
  const isoToday = today.toISOString().slice(0, 10);
  const { data, error } = await db
    .from('closures')
    .select('id, school_id, name, start_date, end_date, emoji')
    .eq('school_id', schoolId)
    .eq('status', 'verified')
    .gte('start_date', isoToday)
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
