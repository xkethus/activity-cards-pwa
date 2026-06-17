import { Link } from "react-router-dom";
import { Icons } from "../components/Icons";

export function AyudaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Inicio
      </Link>
      <div className="mt-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-black/5">
          <Icons.BookOpen size={22} />
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Documentación / ayuda</h1>
      </div>

      <div className="mt-6 space-y-4 text-sm text-slate-600">
        <p>Para llenar una ficha:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Entra a <b>Capturar actividad</b> y elige el tipo (curso/taller o actividad artística).</li>
          <li>Completa los campos obligatorios y el <b>programa por sesiones</b> (cada fecha real).</li>
          <li>Guarda como borrador o <b>envíala a validación</b> cuando esté lista.</li>
          <li>Un director la revisa y la aprueba o la regresa con notas.</li>
        </ol>
        <p className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-black/5">
          Las plantillas oficiales de referencia están en la carpeta <code>docs/</code> del proyecto.
        </p>
      </div>
    </div>
  );
}
