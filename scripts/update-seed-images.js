#!/usr/bin/env node

/**
 * One-off: updates the `images` field on already-seeded listings to real
 * photos (instead of the placehold.co text placeholders scripts/seed.js
 * originally used). Reads the current PERSONAS list from seed.js so the
 * two files can't drift, and matches existing rows by title + seller email.
 *
 * Run with: node scripts/update-seed-images.js
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
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
const SEED_PASSWORD = "SeedUser123!";

const { PERSONAS } = require("./seed-data.js");

async function main() {
  for (const persona of PERSONAS) {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
      email: persona.email,
      password: SEED_PASSWORD,
    });
    if (!signInData?.session) {
      console.log(`${persona.email}: could not sign in (${signInError?.message}), skipping`);
      continue;
    }

    for (const listing of persona.listings) {
      const { data, error } = await client
        .from("listings")
        .update({ images: listing.images })
        .eq("seller_id", signInData.user.id)
        .eq("title", listing.title)
        .select("id");
      if (error) {
        console.log(`  "${listing.title}" failed: ${error.message}`);
      } else {
        console.log(`  "${listing.title}": updated ${data.length} row(s)`);
      }
    }
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
