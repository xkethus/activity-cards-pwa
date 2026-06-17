import { Link } from "react-router-dom";
import { loadAuth } from "../lib/auth";
import { Icons } from "../components/Icons";

export function SaturacionPage() {
  const auth = loadAuth();
  const allowed = auth && (auth.role === "ADMIN" || auth.role === "DIRECTOR");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Inicio
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-black/5">
          <Icons.CalendarRange size={22} />
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Saturación / Calendario</h1>
      </div>

      {!allowed ? (
        <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          Este módulo es solo para directores y administración.
        </p>
      ) : (
        <p className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 ring-1 ring-black/5">
          El visor de saturación se conecta aquí en la siguiente fase: leerá las sesiones de las fichas
          y mostrará el calendario con los días más saturados. Por ahora aún no hay actividades capturadas.
        </p>
      )}
    </div>
  );
}
