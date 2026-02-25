import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProgramHero } from "../components/ProgramHero";
import { SessionNav } from "../components/SessionNav";
import { SessionCard } from "../components/SessionCard";
import { ArtisticCard } from "../components/ArtisticCard";
import { CourseCard } from "../components/CourseCard";
import { loadAuth } from "../lib/auth";
import { getActiveDocId, getDocById, loadDocs, setActiveDocId } from "../lib/db";

export function ViewPage() {
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

  if (!rec) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-black/5">Aún no hay fichas.</div>
        <div className="mt-4 flex gap-2">
          <Link className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5" to="/">
            Menú
          </Link>
          <Link className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" to="/wizard">
            Crear ficha
          </Link>
        </div>
      </div>
    );
  }

  const doc = rec.doc;

  if (doc.kind === "artistic") {
    return (
      <div>
        <div className="no-print">
          <header className="mx-auto max-w-5xl px-4 pt-10 pb-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Actividad artística</h1>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50" to="/docs">
                Fichas
              </Link>
              <Link className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50" to="/edit">
                Editar
              </Link>
              <Link className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" to="/print">
                Exportar PDF
              </Link>
            </div>
          </header>
        </div>
        <ArtisticCard activity={doc.activity} />
      </div>
    );
  }

  if (doc.kind === "course") {
    return (
      <div>
        <div className="no-print">
          <header className="mx-auto max-w-5xl px-4 pt-10 pb-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Curso / Taller / Seminario</h1>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50" to="/docs">
                Fichas
              </Link>
              <Link className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50" to="/edit">
                Editar
              </Link>
              <Link className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" to="/print">
                Exportar PDF
              </Link>
            </div>
          </header>
        </div>
        <CourseCard activity={doc.activity} />
      </div>
    );
  }

  // sessions
  const program = doc.program;
  const [active, setActive] = useState(1);
  const session = program.sessions.find((s) => s.index === active) ?? program.sessions[0];

  return (
    <div>
      <div className="no-print">
        <ProgramHero program={program} />
        <SessionNav total={program.metrics.sessions} active={active} onSelect={setActive} />
      </div>

      {session ? <SessionCard program={program} session={session} /> : null}

      <footer className="no-print mx-auto max-w-5xl px-4 pb-12 text-center">
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50" to="/docs">
            Fichas
          </Link>
          <Link className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50" to="/edit">
            Editar
          </Link>
          <Link className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" to="/print">
            Exportar PDF
          </Link>
        </div>
      </footer>
    </div>
  );
}
