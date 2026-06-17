import type { Role } from "./roles";
import { supabase } from "./supabase";

const AUTH_KEY = "activitycards.auth.v1";
const MSG_KEY = "cmm.authMsg";
const DEMO_KEY = "cmm.demo";

/** Acceso temporal sin correo (para revisar la UI mientras se resuelve el email). */
export function loginDemo() {
  localStorage.setItem(DEMO_KEY, "1");
  saveAuthCache({
    userId: "demo@local",
    email: "demo@local",
    role: "ADMIN",
    name: "Modo demo (sin correo)",
  });
}
function isDemo() {
  return localStorage.getItem(DEMO_KEY) === "1";
}

export type AuthState = {
  userId: string; // usamos el correo como id estable
  email: string;
  role: Role;
  name: string;
};

/** Lectura síncrona del estado cacheado (lo usa el resto de la app). */
export function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthState;
    if (!parsed || !parsed.email || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveAuthCache(state: AuthState | null) {
  if (!state) localStorage.removeItem(AUTH_KEY);
  else localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

/** Mensaje para la pantalla de login (p. ej. "correo no autorizado"). */
export function takeAuthMessage(): string {
  const m = localStorage.getItem(MSG_KEY) || "";
  if (m) localStorage.removeItem(MSG_KEY);
  return m;
}
function setAuthMessage(m: string) {
  localStorage.setItem(MSG_KEY, m);
}

/** Envía el enlace mágico al correo. */
export async function sendMagicLink(email: string): Promise<void> {
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
}

export async function logout(): Promise<void> {
  localStorage.removeItem(DEMO_KEY);
  await supabase.auth.signOut();
  saveAuthCache(null);
}

/**
 * Lee la sesión de Supabase, busca el perfil autorizado por correo y
 * actualiza el cache. Devuelve el AuthState o null si no hay acceso.
 */
export async function refreshAuthFromSession(): Promise<AuthState | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const email = session?.user?.email?.toLowerCase();
  if (!email) {
    if (isDemo()) return loadAuth(); // conserva el acceso temporal sin correo
    saveAuthCache(null);
    return null;
  }
  const { data: prof, error } = await supabase
    .from("perfiles")
    .select("rol,nombre")
    .eq("email", email)
    .maybeSingle();

  if (error || !prof) {
    // Autenticado pero sin perfil en la lista de autorizados.
    setAuthMessage(
      `El correo ${email} no está autorizado todavía. Pide al administrador que te agregue.`
    );
    await supabase.auth.signOut();
    saveAuthCache(null);
    return null;
  }

  const state: AuthState = {
    userId: email,
    email,
    role: prof.rol as Role,
    name: prof.nombre || email,
  };
  saveAuthCache(state);
  return state;
}

/** Suscripción a cambios de sesión (login/logout/refresh). */
export function onAuthChange(cb: () => void) {
  const { data } = supabase.auth.onAuthStateChange(() => cb());
  return () => data.subscription.unsubscribe();
}
