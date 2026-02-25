import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ensureSeedUsers, findUserByAccessCode } from "../lib/db";
import { saveAuth } from "../lib/auth";
import { ROLE_LABEL } from "../lib/roles";

export function LoginPage() {
  const nav = useNavigate();
  useMemo(() => ensureSeedUsers(), []);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string>("");

  function onLogin() {
    setError("");
    const user = findUserByAccessCode(code);
    if (!user) {
      setError("Código inválido.");
      return;
    }

    saveAuth({ userId: user.id, role: user.role, name: user.name });
    nav("/", { replace: true });
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Entrar</h1>
      <p className="mt-2 text-sm text-slate-600">
        Ingresa tu <b>código de acceso</b>. (Modo offline: esto es control operativo, no seguridad fuerte.)
      </p>

      {error ? (
        <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">{error}</div>
      ) : null}

      <div className="mt-6">
        <label className="block">
          <div className="mb-1 text-sm font-medium text-slate-700">Código de acceso</div>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onLogin();
            }}
            placeholder="Ej. 1234"
            autoFocus
          />
        </label>
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        onClick={onLogin}
      >
        Entrar
      </button>

      <div className="mt-8 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <div className="font-semibold">Primer arranque</div>
        <div className="mt-1">
          Se crea un usuario por defecto: <b>{ROLE_LABEL.ADMIN}</b> con código <b>admin</b>. En cuanto entres, cámbialo desde
          “Administración”.
        </div>
      </div>
    </div>
  );
}
