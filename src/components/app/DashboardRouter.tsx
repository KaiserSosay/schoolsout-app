'use client';

import { useMode } from './ModeProvider';
import { ParentDashboard } from './ParentDashboard';
import { KidDashboard } from './KidDashboard';
import type { Closure } from '@/lib/closures';

type ClosureWithSchool = Closure & { schoolName: string | null };

type Profile = {
  id: string;
  school_id: string;
  age_range: string;
  ordinal: number;
  schools?: {
    id: string;
    name: string;
    district?: string | null;
    type?: string | null;
    calendar_status?:
      | 'verified_multi_year'
      | 'verified_current'
      | 'ai_draft'
      | 'needs_research'
      | 'unavailable';
  } | null;
};

type Camp = {
  id: string;
  slug: string;
  name: string;
  price_tier: '$' | '$$' | '$$$';
  ages_min: number;
  ages_max: number;
  categories: string[];
  website_url: string | null;
  neighborhood: string | null;
};

type Save = { id: string; camp: Camp | null };

type Activity = {
  id: string;
  action: 'saved_camp' | 'unsaved_camp' | 'viewed_closure' | 'viewed_camp';
  target_id: string | null;
  target_name: string;
  created_at: string;
  metadata?: Record<string, unknown>;
};

export function DashboardRouter(props: {
  locale: string;
  displayName: string | null;
  profiles: Profile[];
  closures: ClosureWithSchool[];
  saves: Save[];
  savesCount: number;
  activity: Activity[];
}) {
  const { mode } = useMode();
  if (mode === 'kids') return <KidDashboard {...props} />;
  return <ParentDashboard {...props} />;
}
