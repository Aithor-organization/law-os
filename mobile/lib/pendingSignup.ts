// Module-scoped state passed between signup screens (signup → consent → onboarding).
// Not persisted — cleared after account creation. Lives only in memory.
//
// Rationale: Signup is a 3-screen wizard and we don't want to put the password
// into router params (visible in history on web, log-scraped). Module state
// is the simplest way to share non-sensitive form data across screens without
// adding a global store dependency.

type PendingSignup = {
  name: string;
  email: string;
  password: string;
} | null;

let pending: PendingSignup = null;

export function setPendingSignup(value: NonNullable<PendingSignup>) {
  pending = value;
}

export function getPendingSignup(): PendingSignup {
  return pending;
}

export function clearPendingSignup() {
  pending = null;
}
