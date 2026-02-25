import { useMemo, useState } from "react";
import { ProgramHero } from "../components/ProgramHero";
import { SessionNav } from "../components/SessionNav";
import { SessionCard } from "../components/SessionCard";
import { ArtisticCard } from "../components/ArtisticCard";
import { CourseCard } from "../components/CourseCard";
import { loadDoc } from "../lib/storage";

export function ViewPage() {
  const doc = useMemo(() => loadDoc(), []);

  if (doc.kind === "artistic") {
    return (
      <div>
        <div className="no-print">
          <header className="mx-auto max-w-5xl px-4 pt-10 pb-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Actividad artística</h1>
            <p className="mt-2 text-sm text-slate-600">
              Abre <span className="font-mono">/#/edit</span> para editar o <span className="font-mono">/#/print</span> para PDF.
            </p>
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
            <p className="mt-2 text-sm text-slate-600">
              Abre <span className="font-mono">/#/edit</span> para editar o <span className="font-mono">/#/print</span> para PDF.
            </p>
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

      <footer className="no-print mx-auto max-w-5xl px-4 pb-12 text-center text-sm text-slate-500">
        ActivityCards — abre <span className="font-mono">/#/edit</span> para editar · <span className="font-mono">/#/print</span> para PDF.
      </footer>
    </div>
  );
}
