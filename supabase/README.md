# Supabase schema

No Supabase CLI is linked to this project yet, so migrations here are applied
manually rather than via `supabase db push`. This folder exists to keep the
schema version-controlled and reviewable even without a CLI link.

## Applying migrations

Open each file in `migrations/` **in numeric order**, paste its full contents
into the Supabase Dashboard's SQL Editor, and run it. Confirm no errors
before moving to the next file — later files depend on earlier ones
(`is_admin()` from `0001`, tables from `0002`–`0006`, policies in `0007`
assume the pre-flight check documented inside that file has been run).

After each file, spot-check in the Dashboard:
- **Table Editor**: the new table exists with the right columns, and "RLS
  enabled" is on (green).
- **RLS Policies tab**: the policy names/logic match what's in the SQL file
  (the SQL Editor doesn't track a migrations table itself, so this is the
  only reliable way to catch a partial or mis-pasted run).

**Before running `0007_profiles_listings_policies.sql`**, run the pre-flight
query documented at the top of that file
(`select * from pg_policies where tablename in ('profiles','listings');`)
and confirm no existing policy on those tables is `RESTRICTIVE`.

After `0008_storage_buckets.sql`, check **Storage** in the dashboard for two
new buckets — `listing-images` (public) and `verification-docs` (private) —
each with the policies listed in that file.

## Schema drift (2026-08) and `0009_sync_live_schema.sql`

The live project's `profiles`/`listings` tables were found to have been
evolved by hand past what `0000`–`0008` describe: `profiles` had no
`avatar_url` column at all, its vendor-approval column was named
`vendor_status` (enum: `pending`/`verified`/`rejected`) instead of the
`verification_status` text column `0000`/`0007` assumed, `role` only had
`student`/`vendor`/`admin` (no `faculty`/`resident`), and `orders`,
`order_items`, `notifications`, `reviews`, `bulletin_posts`, and `reports`
didn't exist at all (matching `0002`–`0006` never having been pasted in).

**Decision: the live naming stays, the app repo was updated to match it.**
`vendor_status` / `'verified'` and the 3-role enum are now what
`src/types/index.ts` and every `src/lib/api/*` query use — see
`0009_sync_live_schema.sql` for the exact rationale. That file is safe to
paste in one shot even on a partially-migrated project (every statement is
`if not exists` / `create or replace` / `drop policy if exists` +
`create policy`), and ends with `notify pgrst, 'reload schema';` so
PostgREST picks up the changes immediately.

`0007_profiles_listings_policies.sql` was **not** folded into `0009` — the
`profiles_1` embedding error seen alongside this drift strongly suggests
its admin policies are already live, and its own pre-flight check (no
`RESTRICTIVE` policy on `profiles`/`listings`) needs to pass before
re-running it. Run the preflight query first; only re-run `0007` if that
policy is confirmed missing.

`0009` also added `listings.previous_price` + a trigger that captures the
old price on a genuine price drop (and clears itself if price rises again)
— the app shows a "-X%" badge purely from `previous_price > price`, no
history table needed.

`0010_seller_profile_sold_listings.sql` broadens the live
`"Active listings are viewable by all authenticated users"` policy on
`listings` to also allow `status = 'sold'`, so a seller's public profile
can show sold listings (buyer trust / transaction history) — previously
RLS hid any non-active listing from everyone but its own seller,
regardless of what the client asked for. `flagged`/`removed` stay hidden
from non-owners.

`0011` re-asserts the `notifications` insert policy (safe to re-run if
`0009` didn't fully land). `0012` adds a DB-level guard against buying
your own listing, plus an auto "mark sold on purchase" trigger — both as
triggers on `order_items`, not app code, since a client-side-only check
is trivially bypassed and the buyer has no `UPDATE` grant on `listings`
anyway.

## Admin panel — deliberate scope for this phase

`0013_admin_panel_foundations.sql` builds out the admin panel spec'd
separately (bulletin posting locked to admin-only at the DB level,
5 bulletin categories, vendor verification document path + mobile number
capture, a `profiles.is_suspended` flag enforced on new listing creation).

**Explicitly deferred, not forgotten:** that spec calls for
"report-triggered visibility only" — admin should only see profile/listing
detail tied to an active report or verification submission, no proactive
full access. What's live today is broader: `"Admins can view and update
any profile"` (`0009`) and the pre-existing `"Admins can update any
listing"` grant unconditional full read/write on every row, because the
stats dashboard's full counts and the vendor queue (needs every pending
vendor, not just reported ones) depend on it. Narrowing this to
report-scoped access is real future work — it needs the stats dashboard's
counts to come from a `security definer` aggregate function instead of a
plain row-count query, so the count itself doesn't depend on row-level
visibility. Tracked here so it doesn't quietly become "how it's always
been" — see the "Admin RLS scope" decision recorded in this project's
conversation history for the explicit choice to defer it.

Also deferred: `0013` did **not** touch `messages`' INSERT policy to add
the same suspension guard `listings` got — the live policy's real
name/exact `with_check` isn't confirmed (the listings one turned out to
be `"Verified users can create listings"`, not the
`"listings_insert_own"` the migration files describe, with extra
vendor-verification logic baked in that a blind drop-and-recreate would
have silently dropped). Run this first if you want that guard added:

```sql
select policyname, cmd, with_check from pg_policies
where tablename = 'messages' and cmd = 'INSERT';
```

## Capturing the pre-existing schema

`profiles`, `listings`, `conversations`, `messages`, the `handle_new_user`
trigger, and their existing RLS policies were created directly in the
dashboard before this `supabase/` folder existed, and are **not** captured by
anything in `migrations/`. To get them under git:

- **No-CLI path (matches current setup)**: take a manual backup via
  Dashboard → Database → Backups, and separately run these two queries in
  the SQL Editor, pasting the results into a new committed
  `supabase/baseline_schema_dump.md`:
  ```sql
  select tablename, policyname, permissive, roles, cmd, qual, with_check
  from pg_policies where schemaname = 'public';

  select table_name, column_name, data_type, is_nullable, column_default
  from information_schema.columns
  where table_schema = 'public'
    and table_name in ('profiles','listings','conversations','messages');
  ```
  This is a point-in-time snapshot for reference, not a re-runnable
  migration.
- **Future CLI path**: once you're ready to link the CLI —
  `supabase link --project-ref <ref>` then
  `supabase db dump --schema public -f supabase/baseline_schema_dump.sql`.
  Migration numbering in `migrations/` can continue cleanly after that.

## Design decisions worth knowing about

- **`OrderStatus`/`BulletinCategory` match `src/types/index.ts` as it exists
  today** (5-state order status: confirmed/pending/processing/delivered/
  cancelled; 3 bulletin categories: events/services/lost_and_found) — an
  earlier informal punch list described a richer flow (Paid→Delivered→
  Completed/Disputed, 5 bulletin categories including Newsflash/CTS) that
  doesn't match what real screens are already written against. If the richer
  version is wanted, it's an additive future migration (new enum values),
  not a correction to this one.
- **Admin RLS is permissive by role-check, not "reported content only".** A
  stricter "admins can only see rows referenced by a report" model would
  break the admin stats dashboard (needs full counts across all
  listings/users) and the vendor-approval queue (needs to see every pending
  vendor, not just reported ones). `is_admin()` grants full read/write on
  `profiles` and `listings` instead. A future tightening could expose only
  aggregates + reported-item detail via a Postgres view if stricter privacy
  becomes a requirement.
- **`profiles_select_authenticated` is full-row, not column-restricted**
  (Call-out C). Postgres RLS is row-level; genuinely restricting which
  *columns* of another user's profile are visible (e.g. hiding
  `registration_number` from non-admins) requires either a `public_profiles`
  view with a screen-level rewrite of every caller, or all-or-nothing
  column `GRANT`/`REVOKE` that would also block the admin vendor-approval
  queue. Existing working code (`chat-thread.tsx`, `messages.tsx`) already
  does `select('*')`/`select('email', ...)` on other users' profiles, so
  this migration makes that actually work rather than introducing new
  exposure. A `public_profiles` view is the future tightening path.
- **`notifications_insert_any_authenticated` is a known trust gap**: any
  signed-in user can currently insert a notification row for *any*
  `user_id`. Fine for a foundation phase where notifications are
  client-triggered (e.g. a review inserts a notification for the seller),
  but a future pass should move notification creation server-side (DB
  trigger or Edge Function) so this can't be abused to spam other users.
- **`0006_notifications.sql` was not in the original punch list** — added
  because `notifications.tsx` and the `Notification` TS type had no backing
  table, and `src/lib/api/notifications.ts` would otherwise have nothing to
  query when a future pass migrates that screen.
