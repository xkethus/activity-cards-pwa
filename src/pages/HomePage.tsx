import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadAuth, logout } from "../lib/auth";
import { ensureSeedUsers } from "../lib/db";
import { ROLE_LABEL, hasPermission } from "../lib/roles";
import { Icons } from "../components/Icons";

export function HomePage() {
  const nav = useNavigate();
  useMemo(() => ensureSeedUsers(), []);
  const auth = loadAuth();

  if (!auth) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">ActivityCards</h1>
        <p className="mt-2 text-sm text-slate-600">Creador de fichas (offline-first). Todo en español.</p>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-black/5">
              <Icons.LogIn size={18} />
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-900">Necesitas entrar</div>
              <p className="mt-1 text-sm text-slate-600">Usa tu código de acceso.</p>
            </div>
          </div>
          <Link
            to="/login"
            className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Menú</h1>
          <div className="mt-1 text-sm text-slate-600">
            Sesión: <b>{auth.name}</b> · Rol: <b>{ROLE_LABEL[auth.role]}</b>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
          onClick={() => {
            logout();
            nav("/login");
          }}
        >
          <Icons.LogOut size={16} />
          Salir
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MenuCard icon={<Icons.FolderOpen size={18} />} title="Fichas" desc="Ver / seleccionar fichas existentes." to="/docs" />

        {auth.role !== "VIEWER" ? (
          <MenuCard icon={<Icons.PlusCircle size={18} />} title="Crear nueva ficha" desc="Wizard guiado." to="/wizard" />
        ) : null}

        {hasPermission(auth.role, "USERS_MANAGE") ? (
          <MenuCard icon={<Icons.Settings size={18} />} title="Administración" desc="Usuarios y códigos de acceso." to="/admin" />
        ) : null}

        {hasPermission(auth.role, "DOC_VALIDATE") ? (
          <MenuCard icon={<Icons.BadgeCheck size={18} />} title="Validación" desc="Aprobar / rechazar actividades enviadas." to="/director" />
        ) : null}
      </div>

      <div className="mt-10 text-xs text-slate-500">
        Nota: la versión online (Supabase) la integraremos después; por ahora desarrollamos localmente.
      </div>
    </div>
  );
}

function MenuCard({
  icon,
  title,
  desc,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="block rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700 ring-1 ring-black/5">{icon}</span>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{desc}</div>
        </div>
      </div>
    </Link>
  );
}
