import { useEffect, useMemo } from "react";
import { loadDoc } from "../lib/storage";
import { SessionCard } from "../components/SessionCard";
import { ArtisticCard } from "../components/ArtisticCard";
import { CourseCard } from "../components/CourseCard";

export function PrintPage() {
  const doc = useMemo(() => loadDoc(), []);

  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

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
