import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { SessionCard } from "../components/SessionCard";
import { ArtisticCard } from "../components/ArtisticCard";
import { CourseCard } from "../components/CourseCard";
import { loadAuth } from "../lib/auth";
import { getActiveDocId, getDocById, loadDocs, setActiveDocId } from "../lib/db";

export function PrintPage() {
  const auth = loadAuth();
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

  useEffect(() => {
    if (!doc) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [doc]);

  if (!auth) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">Necesitas entrar.</div>
        <Link className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" to="/login">
          Entrar
        </Link>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-black/5">No hay ficha activa.</div>
        <Link className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5" to="/docs">
          Ir a fichas
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="no-print mx-auto max-w-5xl px-4 py-4">
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Se abrirá el diálogo de impresión. En Chrome elige <b>Guardar como PDF</b>. Tamaño papel: <b>Carta</b>. Activa “Fondos”.
        </div>
      </div>

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
