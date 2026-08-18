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
