/**
 * getVerifiedBadge — derives badge info from a user's email domain or vendor status.
 *
 * Rules:
 * - @mycput.ac.za  → "Student" (verified)
 * - @cput.ac.za    → "Staff" (verified)
 * - Vendors with verification_status === 'approved' → "Verified Seller"
 * - Everyone else  → null (no badge)
 */

import { Colors } from '@/constants/theme';
import type { UserProfile, VerifiedBadgeInfo } from '@/types';

export function getVerifiedBadge(user: UserProfile | undefined | null): VerifiedBadgeInfo | null {
  if (!user) return null;

  const emailDomain = user.email.split('@')[1]?.toLowerCase();

  // Students: @mycput.ac.za
  if (emailDomain === 'mycput.ac.za') {
    return { label: 'Student', color: Colors.blue };
  }

  // Staff: @cput.ac.za (faculty, admin, etc.)
  if (emailDomain === 'cput.ac.za') {
    return { label: 'Staff', color: Colors.teal };
  }

  // Vendors: only if admin-approved
  if (user.role === 'vendor' && user.verification_status === 'approved') {
    return { label: 'Verified Seller', color: Colors.success };
  }

  return null;
}

/**
 * canPostListings — whether a user is allowed to create listings or send messages.
 * Pending vendors are restricted to browse-only.
 */
export function canPostListings(user: UserProfile | undefined | null): boolean {
  if (!user) return false;
  if (user.role === 'vendor' && user.verification_status !== 'approved') {
    return false;
  }
  return true;
}
