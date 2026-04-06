const AUTH_KEY = 'booking-admin-session';

export type AuthSession = {
  username: string;
  grantedAt: string;
};

export function getSession(): AuthSession | null {
  const raw = window.localStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function signIn(username: string, password: string): boolean {
  if (username !== 'host' || password !== 'host123') return false;

  window.localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({ username, grantedAt: new Date().toISOString() }),
  );

  return true;
}

export function signOut(): void {
  window.localStorage.removeItem(AUTH_KEY);
}
