import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendMagicLink, takeAuthMessage, loginDemo } from "../lib/auth";

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>(() => takeAuthMessage());
  const [busy, setBusy] = useState(false);

  async function onSend() {
    setError("");
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("Escribe un correo válido.");
      return;
    }
    setBusy(true);
    try {
      await sendMagicLink(value);
      setSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo enviar el enlace.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="flex items-center gap-3 mb-6">
        <img src="/logo.png" alt="Centro Multimedia-CENART" className="h-10 w-auto" />
        <div>
          <div className="text-base font-semibold tracking-tight text-slate-900">CMM · Programa</div>
          <div className="text-xs text-slate-500">Sistema de gestión de fichas de actividades</div>
        </div>
      </div>

      {sent ? (
        <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
          <div className="font-semibold">Revisa tu correo</div>
          <div className="mt-1">
            Te enviamos un enlace de acceso a <b>{email}</b>. Ábrelo en este mismo navegador para entrar.
          </div>
          <button type="button" className="mt-3 text-emerald-800 underline" onClick={() => setSent(false)}>
            Usar otro correo
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Ingresa con tu <b>correo institucional</b>. Recibirás un enlace para entrar (sin contraseña).
          </p>

          {error ? (
            <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">{error}</div>
          ) : null}

          <div className="mt-6">
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Correo</div>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSend();
                }}
                placeholder="tucorreo@ejemplo.com"
                autoFocus
              />
            </label>
          </div>

          <button
            type="button"
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            onClick={onSend}
          >
            {busy ? "Enviando…" : "Enviar enlace de acceso"}
          </button>

          <button type="button" className="mt-3 w-full text-center text-xs text-slate-400" onClick={() => nav("/")}>
            Volver
          </button>

          <div className="mt-8 border-t border-slate-200 pt-4 text-center">
            <button
              type="button"
              className="text-xs text-slate-400 underline hover:text-slate-600"
              onClick={() => {
                loginDemo();
                nav("/", { replace: true });
              }}
            >
              Entrar en modo demo (temporal, sin correo)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
