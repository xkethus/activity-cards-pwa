import { createClient } from "@supabase/supabase-js";

// La URL y la llave "anon" son públicas por diseño; la seguridad real está en las
// políticas RLS de la base (perfiles/fichas/ficha_sesiones).
export const SUPABASE_URL = "https://nnpauvofslosmpwcwyee.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ucGF1dm9mc2xvc21wd2N3eWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTY0NjgsImV4cCI6MjA5NzI5MjQ2OH0.2XOh_8CwpN3uqIAC3zyRyvdQG9qGnc1k8IJmR3gSb4c";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "pkce", // usa ?code= en la URL → no choca con el HashRouter (#/...)
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
