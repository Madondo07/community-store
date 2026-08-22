/**
 * Community Store — Static category lists
 *
 * These aren't user data — just fixed chip labels shown across the UI —
 * so they stay as a hardcoded constant rather than a Supabase table.
 * Everything else lives in Supabase; see src/lib/api/*.
 */

export const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "textbooks", label: "Textbooks" },
  { key: "electronics", label: "Electronics" },
  { key: "furniture", label: "Furniture" },
  { key: "clothing", label: "Clothing" },
  { key: "services", label: "Services" },
  { key: "other", label: "Other" },
] as const;

export const BULLETIN_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "newsflash", label: "Newsflash" },
  { key: "cts", label: "CTS" },
  { key: "events", label: "Events" },
  { key: "services", label: "Services" },
  { key: "lost_and_found", label: "Lost & Found" },
] as const;
