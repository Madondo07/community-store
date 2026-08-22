#!/usr/bin/env node

/**
 * Seeds the connected Supabase project with sample users, listings, reviews,
 * and bulletin posts so the app doesn't look empty during development/demo.
 *
 * Goes through real signup + RLS (not a service-role bypass) — each
 * persona signs up/in for themselves and inserts their own rows, exactly
 * like a real user would through the app. Requires EXPO_PUBLIC_SUPABASE_URL
 * and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env, and that the migrations in
 * supabase/migrations/ (through 0009_sync_live_schema.sql) have already
 * been applied.
 *
 * Run with: node scripts/seed.js
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// ─── Load .env manually (no dotenv dependency) ─────────────────────────────

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error("No .env file found. Copy .env.example to .env and fill in your Supabase project details first.");
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}


const { SEED_PASSWORD, PERSONAS, BULLETIN_POSTS, REVIEWS } = require("./seed-data.js");

// ─── Helpers ────────────────────────────────────────────────────────────────

async function signUpOrIn(persona) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email: persona.email,
    password: SEED_PASSWORD,
    options: { data: { full_name: persona.full_name, role: persona.role } },
  });

  if (signUpData?.session) {
    return { client, userId: signUpData.user.id, status: "created" };
  }

  // Already registered, or email confirmation required on signup — try signing in.
  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email: persona.email,
    password: SEED_PASSWORD,
  });

  if (signInData?.session) {
    return { client, userId: signInData.user.id, status: "signed-in" };
  }

  return {
    client: null,
    userId: null,
    status: "skipped",
    reason: `signUp: ${signUpError?.message ?? "ok, no session"} / signIn: ${signInError?.message ?? "ok, no session"}`,
  };
}

async function main() {
  console.log(`Seeding against ${SUPABASE_URL}\n`);

  /** @type {Record<string, { client: any, userId: string }>} */
  const active = {};
  const listingIdByTitle = {};

  for (const persona of PERSONAS) {
    process.stdout.write(`→ ${persona.full_name} (${persona.email})... `);
    const result = await signUpOrIn(persona);

    if (result.status === "skipped") {
      console.log(`SKIPPED (${result.reason})`);
      continue;
    }
    console.log(result.status);
    active[persona.email] = result;

    if (persona.role === "vendor") {
      const { error } = await result.client
        .from("profiles")
        .update({
          business_name: persona.business_name,
          registration_number: persona.registration_number,
          vendor_status: "verified",
          is_verified: true,
        })
        .eq("id", result.userId);
      if (error) console.log(`   (could not auto-approve vendor profile: ${error.message})`);
    }

    for (const listing of persona.listings) {
      const { data, error } = await result.client
        .from("listings")
        .insert({ ...listing, seller_id: result.userId, status: "active" })
        .select("id, title")
        .single();
      if (error) {
        console.log(`   listing "${listing.title}" failed: ${error.message}`);
      } else {
        listingIdByTitle[data.title] = data.id;
        console.log(`   + listing: ${data.title}`);
      }
    }
  }

  console.log("\n— Bulletin posts —");
  for (const post of BULLETIN_POSTS) {
    const author = active[post.authorEmail];
    if (!author) {
      console.log(`  skipped "${post.title}" (author not signed in)`);
      continue;
    }
    const { error } = await author.client.from("bulletin_posts").insert({
      author_id: author.userId,
      category: post.category,
      title: post.title,
      body: post.body,
      location: post.location,
    });
    console.log(error ? `  "${post.title}" failed: ${error.message}` : `  + ${post.title}`);
  }

  console.log("\n— Reviews —");
  for (const review of REVIEWS) {
    const reviewer = active[review.reviewerEmail];
    const listingId = listingIdByTitle[review.listingTitle];
    if (!reviewer || !listingId) {
      console.log(`  skipped review on "${review.listingTitle}" (missing reviewer or listing)`);
      continue;
    }
    // Look up the listing's seller so we don't insert a self-review.
    const { data: listing } = await reviewer.client
      .from("listings")
      .select("seller_id")
      .eq("id", listingId)
      .single();
    if (!listing || listing.seller_id === reviewer.userId) {
      console.log(`  skipped review on "${review.listingTitle}" (would be a self-review)`);
      continue;
    }
    const { error } = await reviewer.client.from("reviews").insert({
      reviewer_id: reviewer.userId,
      seller_id: listing.seller_id,
      listing_id: listingId,
      rating: review.rating,
      comment: review.comment,
    });
    console.log(error ? `  review on "${review.listingTitle}" failed: ${error.message}` : `  + review on "${review.listingTitle}"`);
  }

  const confirmed = Object.keys(active).length;
  const skipped = PERSONAS.length - confirmed;
  console.log(`\nDone. ${confirmed}/${PERSONAS.length} personas active, ${skipped} skipped.`);
  if (skipped > 0) {
    console.log(
      "Skipped personas likely need email confirmation — check Supabase Dashboard → Authentication → Providers → Email, " +
      "and either disable \"Confirm email\" for local/dev testing or confirm those users manually, then re-run this script " +
      "(it's safe to re-run — existing users sign in instead of re-registering, but will error on duplicate listings)."
    );
  }
  console.log(`\nAll seed accounts use the password: ${SEED_PASSWORD}`);
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
