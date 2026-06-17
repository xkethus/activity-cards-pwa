import { Link, useNavigate } from "react-router-dom";
import { loadAuth, logout } from "../lib/auth";
import { ROLE_LABEL, type Role } from "../lib/roles";
import { Icons } from "../components/Icons";

type Modulo = {
  to: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  roles: Role[];
  accent: string;
};

const MODULOS: Modulo[] = [
  {
    to: "/wizard",
    title: "Capturar actividad",
    desc: "Crear una ficha nueva (curso/taller o actividad artística).",
    icon: <Icons.PlusCircle size={22} />,
    roles: ["CREATOR", "ADMIN"],
    accent: "bg-indigo-50 text-indigo-700",
  },
  {
    to: "/docs",
    title: "Mis fichas",
    desc: "Ver, editar y seguir el estado de tus fichas.",
    icon: <Icons.FolderOpen size={22} />,
    roles: ["CREATOR", "DIRECTOR", "ADMIN"],
    accent: "bg-sky-50 text-sky-700",
  },
  {
    to: "/director",
    title: "Validar actividades",
    desc: "Aprobar o rechazar las fichas enviadas.",
    icon: <Icons.BadgeCheck size={22} />,
    roles: ["DIRECTOR", "ADMIN"],
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    to: "/saturacion",
    title: "Saturación / Calendario",
    desc: "Visor de saturación del calendario por sesiones.",
    icon: <Icons.CalendarRange size={22} />,
    roles: ["DIRECTOR", "ADMIN"],
    accent: "bg-amber-50 text-amber-700",
  },
  {
    to: "/admin",
    title: "Administración",
    desc: "Lista de correos autorizados y sus roles.",
    icon: <Icons.Settings size={22} />,
    roles: ["ADMIN"],
    accent: "bg-rose-50 text-rose-700",
  },
  {
    to: "/ayuda",
    title: "Documentación / ayuda",
    desc: "Guías y plantillas para llenar las fichas.",
    icon: <Icons.BookOpen size={22} />,
    roles: ["CREATOR", "DIRECTOR", "ADMIN", "VIEWER"],
    accent: "bg-slate-100 text-slate-700",
  },
];

export function HomePage() {
  const nav = useNavigate();
  const auth = loadAuth();

  if (!auth) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="flex flex-col items-center text-center">
          <img src="/logo.png" alt="Centro Multimedia-CENART" className="h-14 w-auto" />
          <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">CMM · Programa</h1>
          <p className="mt-2 text-sm text-slate-600">Captura, validación y saturación de actividades.</p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Icons.LogIn size={16} />
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  const visibles = MODULOS.filter((m) => m.roles.includes(auth.role));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Centro Multimedia-CENART" className="h-10 w-auto" />
          <div>
            <div className="text-base font-semibold tracking-tight text-slate-900">CMM · Programa</div>
            <div className="text-xs text-slate-500">Centro Multimedia · CENART</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-right text-xs text-slate-500 sm:block">
            <b className="text-slate-700">{auth.name}</b>
            <br />
            {ROLE_LABEL[auth.role]}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
            onClick={async () => {
              await logout();
              nav("/login");
            }}
          >
            <Icons.LogOut size={16} />
            Salir
          </button>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="group flex flex-col items-start gap-3 rounded-3xl bg-white p-6 text-left ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-black/5 ${m.accent}`}>
              {m.icon}
            </span>
            <div>
              <div className="text-lg font-semibold tracking-tight text-slate-900">{m.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{m.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 text-xs text-slate-400">
        Sesión iniciada como {auth.email}. Datos en Supabase (proyecto cmm-programa-2026).
      </div>
    </div>
  );
}
