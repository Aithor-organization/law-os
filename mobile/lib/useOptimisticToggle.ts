import { useCallback, useRef, useState } from "react";

/**
 * Linear-style optimistic toggle hook.
 *
 * Usage:
 *   const [liked, toggleLiked, busy] = useOptimisticToggle(
 *     initiallyLiked,
 *     async (next) => {
 *       const res = await api.setLiked(next);
 *       return { ok: !res.error, value: res.liked };
 *     },
 *     { onError: (e) => Alert.alert("실패", e) },
 *   );
 *
 * - UI flips to the target state synchronously (no waiting for network).
 * - If the async call fails, state rolls back to the previous value and
 *   the onError callback fires.
 * - If the async call succeeds, the server-returned value (from the
 *   commitFn's return `value`) overwrites the optimistic one — so any
 *   server-side normalization wins over local guess.
 * - While the call is in flight, `busy` is true and the toggle is a no-op
 *   (prevents rapid double-taps spamming the backend).
 *
 * Extracted from statute/[id].tsx and case/[id].tsx — both had the same
 * hand-rolled pattern. Centralizing here so future toggles (star,
 * follow, archive) reuse the same rollback behavior.
 */

interface CommitResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

interface UseOptimisticToggleOptions<T> {
  onError?: (message: string) => void;
  /** If provided, called with the final value after a successful commit. */
  onSuccess?: (finalValue: T) => void;
}

export function useOptimisticToggle<T>(
  initial: T,
  commitFn: (next: T) => Promise<CommitResult<T>>,
  options: UseOptimisticToggleOptions<T> = {},
): [T, (next: T) => Promise<void>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [busy, setBusy] = useState(false);
  // Ref so the latest callback captures the current value without
  // re-creating the function on every render.
  const busyRef = useRef(false);

  const toggle = useCallback(
    async (next: T) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      const previous = value;
      // Optimistic update.
      setValue(next);
      const result = await commitFn(next);
      busyRef.current = false;
      setBusy(false);
      if (!result.ok) {
        setValue(previous);
        options.onError?.(result.error ?? "작업에 실패했습니다.");
        return;
      }
      if (result.value !== undefined) {
        setValue(result.value);
      }
      options.onSuccess?.((result.value ?? next) as T);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, commitFn],
  );

  return [value, toggle, busy];
}
