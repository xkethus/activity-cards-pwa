import type { Role } from "./roles";

const AUTH_KEY = "activitycards.auth.v1";

export type AuthState = {
  userId: string;
  role: Role;
  name: string;
};

export function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthState;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.userId || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuth(state: AuthState | null) {
  if (!state) localStorage.removeItem(AUTH_KEY);
  else localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export function logout() {
  saveAuth(null);
}
