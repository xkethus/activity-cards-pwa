import type { CourseActivity, FixedSchedule } from "../lib/types";
import { formatDateShort, formatSessionSchedule } from "../lib/format";

export function CourseCard({ activity }: { activity: CourseActivity }) {
  return (
    <article className="mx-auto mt-8 max-w-5xl px-4 pb-12">
      <div className="print-card-wrapper overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">

        {/* ── Header ── */}
        <div className="avoid-break print-card-header bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs font-semibold opacity-90">Ficha para cursos / talleres / seminarios</div>
            <img src="/logo_white.png" alt="Centro Multimedia-CENART" className="h-7 w-auto opacity-95" />
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">{activity.title || "(Sin título)"}</h2>
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

          {/* ── Datos generales ── */}
          <div className="avoid-break">
            <Grid2>
              <Field label="Imparte" value={activity.instructor} />
              <Field label="Laboratorio" value={activity.organizingLab} />
              <Field label="Correo" value={activity.contactEmail} />
              <Field label="Sesiones" value={`${activity.sessionsCount || 0} · ${activity.hoursPerSession || 0} horas por sesión`} />
              <Field label="Lugar" value={activity.place} />
              <Field label="Serie / ciclo" value={activity.seriesInfo} />
              <Field label="Colaboración" value={activity.collaboration} />
              <Field label="Asistentes" value={activity.attendees} />
            </Grid2>
          </div>

          {/* ── Programa por sesiones ── */}
          <Section title="Programa por sesiones" className="mt-6 print-section">
            {/* Modo horario fijo: bloque resumen compacto */}
            {activity.scheduleMode !== "VARIABLE" && activity.fixedSchedule ? (
              <ScheduleSummary
                fs={activity.fixedSchedule}
                sessionsCount={activity.sessionsCount}
                hoursPerSession={activity.hoursPerSession}
              />
            ) : null}

            {/* Lista de sesiones: en modo SAME solo muestra las que tienen título */}
            {(() => {
              const sorted = activity.sessions.slice().sort((a, b) => a.index - b.index);
              const isSame = activity.scheduleMode !== "VARIABLE";
              const rows = isSame ? sorted.filter((s) => s.title?.trim()) : sorted;
              if (rows.length === 0) return null;
              return (
                <div className="mt-3 space-y-2">
                  {rows.map((s) => (
                    <div key={s.index} className="print-session-row rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-black/5">
                      <div className="text-xs font-medium text-slate-500">Sesión {s.index}</div>
                      {s.title?.trim() ? (
                        <div className="mt-1 text-sm font-semibold text-slate-800">{s.title}</div>
                      ) : null}
                      {!isSame ? (
                        <div className="mt-1 text-sm text-slate-700">
                          {formatSessionSchedule({ dateISO: s.dateISO, startTime: s.startTime, endTime: s.endTime }) ||
                            "(Fecha y horario por definir)"} · {s.durationHours}h
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              );
            })()}
          </Section>

          {/* ── Secciones de texto: caja gris consistente con los campos de datos ── */}
          {activity.objective ? (
            <Section title="Objetivo" className="mt-6 print-section">
              <TextBox>{activity.objective}</TextBox>
            </Section>
          ) : null}

          {activity.justification ? (
            <Section title="Justificación" className="mt-6 print-section">
              <TextBox>{activity.justification}</TextBox>
            </Section>
          ) : null}

          {activity.syllabus ? (
            <Section title="Temario" className="mt-6 print-section">
              <TextBox>{activity.syllabus}</TextBox>
            </Section>
          ) : null}

          {activity.methodology ? (
            <Section title="Metodología" className="mt-6 print-section">
              <TextBox>{activity.methodology}</TextBox>
            </Section>
          ) : null}

          {activity.entryProfile ? (
            <Section title="Perfil de ingreso" className="mt-6 print-section">
              <TextBox>{activity.entryProfile}</TextBox>
            </Section>
          ) : null}

          {/* ── Materiales: dos columnas, compact ── */}
          <Section title="Materiales" className="mt-6 avoid-break print-section">
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Materiales solicitados" value={activity.materials} />
              {activity.materialFee ? <Field label="Cuota de recuperación" value={activity.materialFee} /> : null}
            </div>
          </Section>

          {/* ── Requerimientos técnicos: chips inline ── */}
          <Section title="Requerimientos técnicos" className="mt-6 avoid-break print-section">
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Chip label="Internet" value={activity.tech.internet} />
              <Chip label="Montaje" value={activity.tech.setup} />
              <Chip label="Transmisión" value={activity.tech.broadcast} />
              <Chip label="Proyección/Audio" value={activity.tech.projectionAudio} />
              {activity.tech.other ? <Chip label="Otros" value={activity.tech.other} /> : null}
            </ul>
          </Section>

          {/* ── Difusión: layout de 2 columnas en pantalla, texto limpio en impresión ── */}
          <Section title="Difusión" className="mt-6 print-section">
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 print-grid-text">
              <PrintField label="Líneas fuerza" value={activity.promoLines} />
              <PrintField label="Recursos para atención al público" value={activity.audienceResources} />
              {activity.keywords ? <PrintField label="Palabras clave" value={activity.keywords} /> : null}
              <PrintField label="Semblanza" value={activity.bio} />
              {activity.registrationConsiderations ? (
                <PrintField label="Consideraciones de registro" value={activity.registrationConsiderations} />
              ) : null}
            </div>
          </Section>

          {/* ── Campos internos: solo pantalla ── */}
          {activity.internalNotes ? (
            <Section title="Campos internos (no aparecen en la ficha)" className="mt-6 no-print">
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{activity.internalNotes}</p>
            </Section>
          ) : null}

        </div>
      </div>
    </article>
  );
}

// ── Componentes internos ──────────────────────────────────────────

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

/** Campo visual: caja gris en pantalla, texto limpio en impresión.
 *  Si el valor tiene varias líneas se renderiza como lista con bullets. */
function PrintField({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null;
  const lines = value.split("\n").map((l) => l.trim()).filter(Boolean);
  const isList = lines.length > 1;
  return (
    <div className="print-field rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-black/5">
      <div className="print-field-label text-xs font-medium text-slate-500">{label}</div>
      {isList ? (
        <ul className="print-field-value mt-2 space-y-1.5">
          {lines.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm font-semibold text-slate-800">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="print-field-value mt-1 text-sm font-semibold text-slate-800 whitespace-pre-wrap">{value}</div>
      )}
    </div>
  );
}

/** Caja gris para secciones de texto largo (Objetivo, Justificación, Temario…) */
function TextBox({ children }: { children: string }) {
  return (
    <div className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-black/5">
      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{children}</p>
    </div>
  );
}

/** Campo de datos generales: siempre caja */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-black/5">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800 whitespace-pre-wrap">{value || ""}</div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null;
  return (
    <li className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-black/5">
      <span className="font-semibold text-slate-800">{label}:</span> {value}
    </li>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

/** Bloque compacto de horario fijo: periodo · días · horario · conteo */
function ScheduleSummary({
  fs,
  sessionsCount,
  hoursPerSession,
}: {
  fs: FixedSchedule;
  sessionsCount: number;
  hoursPerSession: number;
}) {
  const start = formatDateShort(fs.startDateISO);
  const end = formatDateShort(fs.endDateISO);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-indigo-50 px-4 py-3 ring-1 ring-indigo-100 text-sm">
      {/* Ícono calendario */}
      <svg className="h-4 w-4 flex-shrink-0 text-indigo-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
      </svg>

      {start || end ? (
        <span className="text-slate-700">
          {start && end ? `${start} – ${end}` : start ? `Desde ${start}` : `Hasta ${end}`}
        </span>
      ) : null}

      {fs.weekdays.length > 0 ? (
        <>
          <span className="text-slate-300">·</span>
          <span className="text-slate-700">{fs.weekdays.join(", ")}</span>
        </>
      ) : null}

      {(fs.startTime || fs.endTime) ? (
        <>
          <span className="text-slate-300">·</span>
          <span className="text-slate-700">
            {fs.startTime && fs.endTime ? `${fs.startTime} – ${fs.endTime} h` : fs.startTime || fs.endTime}
          </span>
        </>
      ) : null}

      <span className="text-slate-300">·</span>
      <span className="font-semibold text-indigo-700">
        {sessionsCount} sesiones · {hoursPerSession} h c/u
      </span>
    </div>
  );
}
