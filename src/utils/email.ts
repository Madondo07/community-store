export const STUDENT_EMAIL_DOMAIN = '@mycput.ac.za';

const STUDENT_NUMBER = /^\d{9}$/;

/**
 * CPUT student numbers are 9 digits. When the user has typed exactly 9
 * digits (and nothing else), complete it to `<number>@mycput.ac.za`.
 *
 * Only fires while the field is GROWING (`next` longer than `previous`):
 *  - typing a full address themselves never matches (it contains `@`/letters),
 *  - backspacing the suffix away down to the bare 9 digits is not re-filled,
 *    so a wrong auto-fill can always be edited or cleared.
 */
export function autoSuffixStudentEmail(next: string, previous: string): string {
  if (next.length > previous.length && STUDENT_NUMBER.test(next)) {
    return next + STUDENT_EMAIL_DOMAIN;
  }
  return next;
}
