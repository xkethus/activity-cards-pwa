import { useEffect, useMemo } from "react";
import { loadProgram } from "../lib/storage";
import { SessionCard } from "../components/SessionCard";

export function PrintPage() {
  const program = useMemo(() => loadProgram(), []);

  useEffect(() => {
    // Let layout settle, then open print dialog.
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-white">
      <div className="no-print mx-auto max-w-5xl px-4 py-4">
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Se abrirá el diálogo de impresión. En Chrome elige <b>Guardar como PDF</b>. Configura <b>Cartas</b> y “Fondos” activado.
        </div>
      </div>

      {program.sessions
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((session) => (
          <div key={session.index} className="print-session">
            <SessionCard program={program} session={session} />
          </div>
        ))}
    </div>
  );
}
