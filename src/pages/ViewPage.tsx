import { useMemo, useState } from "react";
import { ProgramHero } from "../components/ProgramHero";
import { SessionNav } from "../components/SessionNav";
import { SessionCard } from "../components/SessionCard";
import { loadProgram } from "../lib/storage";

export function ViewPage() {
  const program = useMemo(() => loadProgram(), []);
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
