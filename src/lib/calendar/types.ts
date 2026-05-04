// Phase 5.0 Calendar View — shared types passed from server pages
// down to the (client) calendar components.
import type { ClosureType } from './closure-type';

export type CalendarClosure = {
  id: string;
  name: string;
  emoji: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  status: 'verified' | 'ai_draft' | 'rejected' | 'derived' | string;
  closure_type?: ClosureType | null;
  // For /app/calendar — multi-school view. School-scoped pages leave this null.
  school_id?: string | null;
  school_name?: string | null;
};

export type CalendarKid = {
  id: string;
  ordinal: number;
  schoolId: string;
  schoolName: string;
  // Stored client-side only; passed through here from local storage / app.
  displayInitial?: string | null;
};
