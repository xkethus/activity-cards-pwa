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
      <div className="flex items-center justify-between">
        <img src="/logo.png" alt="Centro Multimedia-CENART" className="h-9 w-auto" />
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
          <div className="text-xs font-semibold opacity-80 uppercase tracking-widest">Centro Multimedia · CENART</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Gestor de fichas de actividades</h2>
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

          <div className="sm:col-span-2 mt-2 flex flex-wrap items-center gap-3">
            {hasPermission(auth.role, "USERS_MANAGE") ? (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
              >
                <Icons.Settings size={16} />
                Administración
              </Link>
            ) : null}

            {hasPermission(auth.role, "DOC_VALIDATE") ? (
              <Link
                to="/director"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
              >
                <Icons.BadgeCheck size={16} />
                Validación (directores)
              </Link>
            ) : null}

            <span className="ml-auto text-xs text-slate-500">
              <b>{auth.name}</b> · {ROLE_LABEL[auth.role]}
            </span>
          </div>
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
      className="group relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-3xl bg-white p-7 text-center ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* ── Default state: centrado vertical y horizontal, se desvanece al hover ── */}
      <div className="flex flex-col items-center gap-3 transition-opacity duration-200 group-hover:opacity-0">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-700 ring-1 ring-black/5">
          {icon}
        </span>
        <div>
          <div className="text-xl font-semibold tracking-tight text-slate-900">{title}</div>
          <p className="mt-1.5 max-w-[200px] text-sm leading-relaxed text-slate-500">{desc}</p>
        </div>
      </div>

      {/* ── Hover overlay: reemplaza el contenido, sin repetir ícono ni título ── */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-cyan-400/8" />
        <div className="relative w-full px-5">
          <div className="rounded-2xl bg-white/95 px-4 py-4 ring-1 ring-black/8 backdrop-blur-sm">
            <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {hoverTitle}
            </div>
            <ul className="space-y-1.5">
              {hoverItems.map((it) => (
                <li key={it} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Link>
  );
}
