import { supabase } from '@/lib/supabase';

import { unwrap } from './_shared';

/**
 * Finds an existing conversation between two users about the SAME listing
 * context, or creates a new one. Scoped by `listing_id` (not just the
 * participant pair) so a buyer messaging the same seller about a different
 * product gets its own thread with its own product snapshot, instead of
 * silently merging into whatever thread they already had going — a buyer
 * asking about listing B shouldn't land in the middle of an old
 * conversation about listing A. Messaging with no product context (e.g.
 * from a seller's profile page, listingId omitted) reuses/creates the one
 * "general" thread (listing_id is null) for that pair.
 * Matches the conversations table shape already used by messages.tsx /
 * chat-thread.tsx (participant_one/participant_two, not participant_ids).
 */
export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
  listingId?: string,
): Promise<string> {
  let query = supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_one.eq.${userId},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${userId})`,
    );
  query = listingId ? query.eq('listing_id', listingId) : query.is('listing_id', null);

  const existing = await query.maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data.id;

  const created = await supabase
    .from('conversations')
    .insert({ participant_one: userId, participant_two: otherUserId, listing_id: listingId ?? null })
    .select('id')
    .single();
  return unwrap<{ id: string }>(created as any).id;
}
