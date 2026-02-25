import type { ArtisticActivity } from "../lib/types";

export function ArtisticCard({ activity }: { activity: ArtisticActivity }) {
  return (
    <article className="mx-auto mt-8 max-w-5xl px-4 pb-12">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-6 text-white">
          <div className="text-xs font-semibold/none opacity-90">Ficha para actividades artísticas</div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{activity.title || "(Sin título)"}</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs opacity-95">
            {activity.modality ? (
              <span className="rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/20">{activity.modality}</span>
            ) : null}
            {activity.dateAndTime ? (
              <span className="rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/20">
                {activity.dateAndTime}
              </span>
            ) : null}
          </div>
        </div>

        <div className="px-6 py-6">
          <Grid2>
            <Field label="Participantes" value={activity.participants} />
            <Field label="Laboratorio" value={activity.organizingLab} />
            <Field label="Ciclo" value={activity.cycleName} />
            <Field label="Colaboración" value={activity.collaboration} />
          </Grid2>

          <Section title="Descripción" className="mt-6">
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{activity.description || ""}</p>
          </Section>

          <Grid2 className="mt-6">
            <Field label="Ensayos" value={activity.rehearsalSchedule} />
            <Field label="Montaje" value={activity.setupSchedule} />
            <Field label="Lugar" value={activity.place} />
            <Field label="Particularidades" value={activity.particularities} />
          </Grid2>

          <Section title="Requerimientos técnicos" className="mt-6 avoid-break">
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Chip label="Internet" value={activity.tech.internet} />
              <Chip label="Montaje" value={activity.tech.setup} />
              <Chip label="Ensayos" value={activity.tech.rehearsal} />
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
        <span className="h-6 w-1 rounded-full bg-violet-600/70" />
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

function Grid2({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={"grid grid-cols-1 gap-3 sm:grid-cols-2 " + (className ?? "")}>{children}</div>;
}
