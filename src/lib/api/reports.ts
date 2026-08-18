import { supabase } from '@/lib/supabase';
import type { AdminStats, Report, ReportStatus } from '@/types';

import { unwrap } from './_shared';
import { updateListing } from './listings';

// profiles is referenced twice (reported_by, reported_user_id), so each join
// must be disambiguated by its FK constraint name (Postgres default naming:
// `<table>_<column>_fkey`).
const REPORT_JOIN =
  '*, listing:listings(*), reported_user:profiles!reports_reported_user_id_fkey(*), reporter:profiles!reports_reported_by_fkey(*)';

export async function reportListing(
  reportedBy: string,
  listingId: string,
  reason: string,
): Promise<Report> {
  const res = await supabase
    .from('reports')
    .insert({ reported_by: reportedBy, reported_listing_id: listingId, reason })
    .select(REPORT_JOIN)
    .single();
  return unwrap<Report>(res as any);
}

export async function reportUser(
  reportedBy: string,
  userId: string,
  reason: string,
): Promise<Report> {
  const res = await supabase
    .from('reports')
    .insert({ reported_by: reportedBy, reported_user_id: userId, reason })
    .select(REPORT_JOIN)
    .single();
  return unwrap<Report>(res as any);
}

export async function getReports(filters: { status?: ReportStatus } = {}): Promise<Report[]> {
  let q = supabase.from('reports').select(REPORT_JOIN);
  if (filters.status) q = q.eq('status', filters.status);
  const res = await q.order('created_at', { ascending: false });
  return unwrap<Report[]>(res as any);
}

/**
 * Updates a report's status. When marking a listing report as 'removed',
 * this also flips the reported listing's own status to 'removed' — that
 * two-step behavior is intentional, not implicit.
 */
export async function updateReportStatus(id: string, status: ReportStatus): Promise<void> {
  const res = await supabase
    .from('reports')
    .update({ status })
    .eq('id', id)
    .select('reported_listing_id')
    .single();
  const row = unwrap<{ reported_listing_id: string | null }>(res as any);

  if (status === 'removed' && row.reported_listing_id) {
    await updateListing(row.reported_listing_id, { status: 'removed' });
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  const [flagged, reportedUserRows, activeListings, activeUsers] = await Promise.all([
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .not('reported_listing_id', 'is', null),
    // Fetched (not head:true count) because reported_users needs a DISTINCT
    // count of reported_user_id, which a plain row count can't give.
    supabase
      .from('reports')
      .select('reported_user_id')
      .eq('status', 'pending')
      .not('reported_user_id', 'is', null),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  for (const res of [flagged, reportedUserRows, activeListings, activeUsers]) {
    if (res.error) throw new Error(res.error.message);
  }

  const distinctReportedUsers = new Set(
    (reportedUserRows.data ?? []).map((r: { reported_user_id: string }) => r.reported_user_id),
  );

  return {
    flagged_listings: flagged.count ?? 0,
    reported_users: distinctReportedUsers.size,
    active_listings: activeListings.count ?? 0,
    active_users: activeUsers.count ?? 0,
  };
}
