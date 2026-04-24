/**
 * Conversation event bus — lightweight in-memory pub/sub used to notify
 * listeners (e.g. the tab bar badge in app/(tabs)/_layout.tsx) when a
 * conversation is created, archived, or deleted.
 *
 * Why not Zustand/Redux: the project has no global state library yet,
 * and a bus is enough for the single "refetch the active-conversation
 * count" concern. If more cross-screen state appears, promote this to
 * a proper store.
 *
 * Usage:
 *   // emit after mutating conversations
 *   emitConversationChanged();
 *
 *   // subscribe (e.g. in a useEffect with cleanup)
 *   const unsubscribe = subscribeConversationChanged(() => refetch());
 *   return unsubscribe;
 */

type Listener = () => void;

const listeners = new Set<Listener>();

export function emitConversationChanged(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (err) {
      if (__DEV__) {
        console.warn("[conversationEvents] listener failed:", err);
      }
    }
  }
}

export function subscribeConversationChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
