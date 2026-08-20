import type { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';

/** Unwraps a Supabase response, throwing on error instead of returning a tuple. */
export function unwrap<T>(res: { data: T | null; error: PostgrestError | null }): T {
  if (res.error) throw new Error(res.error.message);
  if (res.data === null) throw new Error('Expected data but received null.');
  return res.data;
}

/** Like unwrap, but tolerates a null result (e.g. `.single()` on a missing row). */
export function unwrapNullable<T>(res: PostgrestSingleResponse<T>): T | null {
  if (res.error) {
    // PGRST116 = "no rows found" for `.single()` — treat as null, not an error.
    if (res.error.code === 'PGRST116') return null;
    throw new Error(res.error.message);
  }
  return res.data;
}
