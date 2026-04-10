import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SessionCard } from "../components/SessionCard";
import { ArtisticCard } from "../components/ArtisticCard";
import { CourseCard } from "../components/CourseCard";
import { loadAuth } from "../lib/auth";
import { getActiveDocId, getDocById, loadDocs, setActiveDocId } from "../lib/db";

export function PrintPage() {
  const auth = loadAuth();
  const [printed, setPrinted] = useState(false);

  const rec = useMemo(() => {
    const docs = loadDocs();
    if (docs.length === 0) return null;
    const active = getActiveDocId();
    const byId = active ? getDocById(active) : null;
    const picked = byId ?? docs[0];
    if (picked && picked.id !== active) setActiveDocId(picked.id);
    return picked;
  }, []);

  const doc = rec?.doc;

  if (!auth) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Necesitas entrar para exportar.
        </div>
        <Link
          className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          to="/login"
        >
          Entrar
        </Link>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-black/5">
          No hay ficha activa.
        </div>
        <Link
          className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5"
          to="/docs"
        >
          Ir a fichas
        </Link>
      </div>
    );
  }

  function triggerPrint() {
    setPrinted(true);
    window.print();
  }

  return (
    <div className="bg-white">
      {/* ── Print controls — hidden when printing ── */}
      <div className="no-print mx-auto max-w-5xl px-4 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-black/5">
          <div>
            <div className="text-sm font-semibold text-slate-900">Vista previa de impresión</div>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li>① En el diálogo elige <b>Guardar como PDF</b> (Chrome) o <b>Microsoft Print to PDF</b></li>
              <li>② Tamaño de papel: <b>Carta</b></li>
              <li>③ Activa <b>"Gráficos de fondo"</b> para conservar los colores</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/edit"
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
            >
              ← Editar
            </Link>
            <button
              type="button"
              onClick={triggerPrint}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {printed ? "Imprimir de nuevo" : "Imprimir / Guardar PDF"}
            </button>
          </div>
        </div>

        {/* Draft watermark notice */}
        {rec?.status === "BORRADOR" || rec?.status === "ENVIADA" ? (
          <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
            Esta ficha aún no ha sido aprobada (estado: <b>{rec.status === "BORRADOR" ? "Borrador" : "Enviada a validación"}</b>). Considera esperar la aprobación antes de distribuirla.
          </div>
        ) : null}
      </div>

      {/* ── Printable content ── */}
      {doc.kind === "sessions" ? (
        doc.program.sessions
          .slice()
          .sort((a, b) => a.index - b.index)
          .map((session) => (
            <div key={session.index} className="print-session">
              <SessionCard program={doc.program} session={session} />
            </div>
          ))
      ) : doc.kind === "artistic" ? (
        <div className="print-session">
          <ArtisticCard activity={doc.activity} />
        </div>
      ) : (
        <div className="print-session">
          <CourseCard activity={doc.activity} />
        </div>
      )}
    </div>
  );
}
