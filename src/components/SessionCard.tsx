import type { Program, Session } from "../lib/types";

export function SessionCard({ program, session }: { program: Program; session: Session }) {
  return (
    <article className="mx-auto mt-8 max-w-5xl px-4 pb-12">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-6 text-white">
          <div className="text-xs font-semibold/none opacity-90">Sesión {session.index} de {program.metrics.sessions}</div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{session.title}</h2>
          <div className="mt-3 flex flex-wrap gap-4 text-sm opacity-95">
            <Meta label={session.dateText} />
            <Meta label={session.timeText} />
          </div>
        </div>

        <div className="px-6 py-6">
          <Section title="Objetivos de Aprendizaje" className="avoid-break">
            <ul className="mt-3 space-y-2">
              {session.learningObjectives.map((o, idx) => (
                <li key={idx} className="flex gap-3 text-slate-700">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">✓</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </Section>

          <div className="mt-6" />

          <Section title="Desglose Horario (3 horas)">
            <div className="mt-3 space-y-4">
              {session.agenda.map((a, idx) => (
                <div key={idx} className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-black/5">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="text-sm font-semibold text-slate-800">{a.time}</div>
                    <div className="text-xs font-medium text-slate-500">{a.durationMin} min</div>
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-800">{a.title}</div>
                  {a.notes ? <div className="mt-1 text-sm text-slate-600">{a.notes}</div> : null}
                </div>
              ))}
            </div>
          </Section>

          <div className="mt-6" />

          <Section title="Materiales Requeridos" className="avoid-break">
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {session.materials.map((m, idx) => (
                <li key={idx} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-black/5">
                  {m}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </article>
  );
}

function Meta({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">
      <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
      <span>{label}</span>
    </div>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className ?? ""}>
      <div className="flex items-center gap-3">
        <span className="h-6 w-1 rounded-full bg-indigo-600/70" />
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {children}
    </section>
  );
}
