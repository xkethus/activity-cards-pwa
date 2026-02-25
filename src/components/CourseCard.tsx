import type { CourseActivity } from "../lib/types";

export function CourseCard({ activity }: { activity: CourseActivity }) {
  return (
    <article className="mx-auto mt-8 max-w-5xl px-4 pb-12">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-6 text-white">
          <div className="text-xs font-semibold/none opacity-90">Ficha para cursos / talleres / seminarios</div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{activity.title || "(Sin título)"}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs opacity-95">
            {activity.typeLabel ? (
              <span className="rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/20">{activity.typeLabel}</span>
            ) : null}
            {activity.modality ? (
              <span className="rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/20">{activity.modality}</span>
            ) : null}
            {activity.dateAndTime ? (
              <span className="rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/20">{activity.dateAndTime}</span>
            ) : null}
          </div>
        </div>

        <div className="px-6 py-6">
          <Grid2>
            <Field label="Imparte" value={activity.instructor} />
            <Field label="Laboratorio" value={activity.organizingLab} />
            <Field label="Correo" value={activity.contactEmail} />
            <Field
              label="Sesiones"
              value={`${activity.sessionsCount || 0} · ${activity.hoursPerSession || 0} horas por sesión`}
            />
            <Field label="Lugar" value={activity.place} />
            <Field label="Serie / ciclo" value={activity.seriesInfo} />
            <Field label="Colaboración" value={activity.collaboration} />
            <Field label="Asistentes" value={activity.attendees} />
          </Grid2>

          <Section title="Programa por sesiones" className="mt-6 avoid-break">
            <div className="mt-3 space-y-2">
              {activity.sessions
                .slice()
                .sort((a, b) => a.index - b.index)
                .map((s) => (
                  <div key={s.index} className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-black/5">
                    <div className="text-xs font-medium text-slate-500">Sesión {s.index}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">
                      {(s.title?.trim() ? s.title : "")}
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      {s.dateText || "(Fecha por definir)"} · {s.timeText || "(Horario por definir)"} · {s.durationHours}h
                    </div>
                  </div>
                ))}
            </div>
          </Section>

          <Section title="Objetivo" className="mt-6">
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{activity.objective || ""}</p>
          </Section>

          <Section title="Justificación" className="mt-6">
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{activity.justification || ""}</p>
          </Section>

          <Section title="Temario" className="mt-6">
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{activity.syllabus || ""}</p>
          </Section>

          <Section title="Metodología" className="mt-6">
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{activity.methodology || ""}</p>
          </Section>

          <Section title="Perfil de ingreso" className="mt-6">
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{activity.entryProfile || ""}</p>
          </Section>

          <Section title="Materiales" className="mt-6 avoid-break">
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Materiales solicitados" value={activity.materials} />
              <Field label="Cuota de recuperación" value={activity.materialFee} />
            </div>
          </Section>

          <Section title="Requerimientos técnicos" className="mt-6 avoid-break">
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Chip label="Internet" value={activity.tech.internet} />
              <Chip label="Montaje" value={activity.tech.setup} />
              <Chip label="Transmisión" value={activity.tech.broadcast} />
              <Chip label="Proyección/Audio" value={activity.tech.projectionAudio} />
              <Chip label="Otros" value={activity.tech.other} />
            </ul>
          </Section>

          <Section title="Difusión" className="mt-6">
            <Grid2>
              <Field label="Líneas fuerza" value={activity.promoLines} />
              <Field label="Recursos para atención al público" value={activity.audienceResources} />
              <Field label="Palabras clave" value={activity.keywords} />
              <Field label="Semblanza" value={activity.bio} />
            </Grid2>
          </Section>

          <Section title="Campos internos (no aparecen en la ficha)" className="mt-6 no-print">
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{activity.internalNotes || ""}</p>
          </Section>
        </div>
      </div>
    </article>
  );
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-black/5">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800 whitespace-pre-wrap">{value || ""}</div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <li className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-black/5">
      <span className="font-semibold text-slate-800">{label}:</span> {value || ""}
    </li>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
