/**
 * Formats a timestamp the way an announcement/bulletin feed usually does:
 * relative for anything recent ("1m ago", "1 hour ago", "12 hours ago"),
 * falling back to an actual date + time once it's a day or older.
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;

  const sameYear = date.getFullYear() === now.getFullYear();
  const datePart = date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  return `${datePart}, ${timePart}`;
}
