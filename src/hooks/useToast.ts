import { useCallback, useState } from 'react';

export type ToastVariant = 'success' | 'error';

interface ToastState {
  message: string;
  variant: ToastVariant;
}

/**
 * Reusable toast state for the <Toast> component (src/components/ui/Toast.tsx)
 * — pairs `message`/`variant` (spread onto <Toast>) with `showToast` so a
 * screen doesn't have to hand-roll its own useState + onHide wiring.
 *
 * Usage:
 *   const { toast, showToast, hideToast } = useToast();
 *   showToast('Post published!');
 *   <Toast message={toast?.message ?? null} variant={toast?.variant} onHide={hideToast} />
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast({ message, variant });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  return { toast, showToast, hideToast };
}
