// Types for the Phase 3.1 operator-dashboard tables. Mirror the migration
// 030 schema verbatim — when in doubt, the migration is authoritative.

export type CampOperatorRole = 'owner' | 'manager';

export type CampOperator = {
  id: string;
  camp_id: string;
  user_id: string;
  role: CampOperatorRole;
  created_at: string;
  invited_at: string | null;
  accepted_at: string | null;
  invite_token: string | null;
  invite_expires_at: string | null;
};

// Insert payload — id, created_at, role default; everything else explicit.
export type NewCampOperator = {
  camp_id: string;
  user_id: string;
  role?: CampOperatorRole;
  invited_at?: string;
  accepted_at?: string | null;
  invite_token?: string;
  invite_expires_at?: string;
};

export type CampClosureCoverage = {
  id: string;
  camp_id: string;
  closure_id: string;
  is_open: boolean;
  notes: string | null;
  set_by_operator_id: string | null;
  updated_at: string;
};

// Upsert payload for the dashboard's auto-save flow.
export type NewCampClosureCoverage = {
  camp_id: string;
  closure_id: string;
  is_open: boolean;
  notes?: string | null;
  set_by_operator_id?: string | null;
};
