import { supabase } from '@/lib/supabase';

import { unwrap } from './_shared';

/**
 * Finds an existing conversation between two users (regardless of which
 * listing originally started it), or creates one tagged with listingId.
 * Matches the conversations table shape already used by messages.tsx /
 * chat-thread.tsx (participant_one/participant_two, not participant_ids).
 */
export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
  listingId?: string,
): Promise<string> {
  const existing = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_one.eq.${userId},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${userId})`,
    )
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data.id;

  const created = await supabase
    .from('conversations')
    .insert({ participant_one: userId, participant_two: otherUserId, listing_id: listingId ?? null })
    .select('id')
    .single();
  return unwrap<{ id: string }>(created as any).id;
}
