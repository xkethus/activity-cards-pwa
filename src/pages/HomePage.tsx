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
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">ActivityCards</h1>
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

      <section className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-8 text-white">
          <div className="text-xs font-semibold/none opacity-80">Herramienta institucional</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Crea y gestiona fichas en minutos</h2>
          <p className="mt-2 max-w-2xl text-sm opacity-90">
            Dos pasos: <b>crear</b> una ficha con el wizard y luego <b>ver</b> (editar, enviar a validación, exportar PDF).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          {auth.role !== "VIEWER" ? (
            <HeroAction
              to="/wizard"
              icon={<Icons.PlusCircle size={20} />}
              title="Crear ficha"
              desc="Wizard guiado (curso/taller o actividad artística)."
              hoverTitle="Qué incluye"
              hoverItems={["Campos obligatorios", "Programa por sesiones", "Requerimientos técnicos", "Difusión"]}
            />
          ) : (
            <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-black/5">
              <div className="text-sm font-semibold text-slate-900">Crear ficha</div>
              <div className="mt-1 text-sm text-slate-600">Tu rol actual no permite crear.</div>
            </div>
          )}

          <HeroAction
            to="/docs"
            icon={<Icons.FolderOpen size={20} />}
            title="Ver fichas"
            desc="Lista de fichas y acciones: ver, editar, validación, exportaciones."
            hoverTitle="Desde aquí puedes"
            hoverItems={["Abrir ficha", "Editar", "Enviar a validación", "Exportar PDF / JSON"]}
          />

          {hasPermission(auth.role, "USERS_MANAGE") ? (
            <div className="sm:col-span-2 mt-2">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
              >
                <Icons.Settings size={16} />
                Administración
              </Link>
            </div>
          ) : null}

          {hasPermission(auth.role, "DOC_VALIDATE") ? (
            <div className="sm:col-span-2">
              <Link
                to="/director"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
              >
                <Icons.BadgeCheck size={16} />
                Validación (directores)
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <div className="mt-10 text-xs text-slate-500">
        Nota: guardado automático en este navegador (localStorage). Para compartir entre equipos usaremos exportación y (opcional) Drive.
      </div>
    </div>
  );
}

function HeroAction({
  to,
  icon,
  title,
  desc,
  hoverTitle,
  hoverItems,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  hoverTitle: string;
  hoverItems: string[];
}) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-800 ring-1 ring-black/5 transition group-hover:bg-white">
          {icon}
        </span>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{desc}</div>
        </div>
      </div>

      {/* Hover / focus panel */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 group-focus:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-cyan-500/10" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="rounded-2xl bg-white/85 p-4 text-sm text-slate-800 ring-1 ring-black/10 backdrop-blur">
            <div className="text-xs font-semibold text-slate-600">{hoverTitle}</div>
            <ul className="mt-2 list-disc pl-5">
              {hoverItems.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Link>
  );
}
