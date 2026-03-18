import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadAuth } from "../lib/auth";
import { createDoc } from "../lib/db";
import type { ActivityDoc, ActivityType, ArtisticActivity, CourseActivity, SessionLite } from "../lib/types";
import { defaultArtisticActivity, defaultCourseActivity } from "../lib/defaultProgram";
import { normalizeLiteSessions } from "../lib/courseSessions";
import { validateForSubmission } from "../lib/validation";
import { CourseCard } from "../components/CourseCard";
import { ArtisticCard } from "../components/ArtisticCard";
import { DateTimeRangeField } from "../components/DateTimeRangeField";
import { DatePickerField } from "../components/DatePickerField";
import { LAB_OPTIONS } from "../lib/labs";
import { HelpTip } from "../components/Tooltip";
import { StepCard } from "../components/StepCard";

type StepId =
  | "tipo"
  | "contacto"
  | "sesiones"
  | "logistica"
  | "contenido"
  | "difusion"
  | "preview"
  | "general"
  | "logistica_art"
  | "difusion_art";

function isBlank(x: string | undefined | null) {
  return !x || !String(x).trim();
}

function warningForStep(kind: ActivityType, stepId: StepId, title: string, course: CourseActivity, art: ArtisticActivity): string[] {
  if (kind === "course") {
    switch (stepId) {
      case "tipo": {
        const miss: string[] = [];
        if (isBlank(title)) miss.push("Título");
        if (isBlank(course.typeLabel)) miss.push("Tipo (curso/taller/seminario)");
        return miss;
      }
      case "contacto": {
        const miss: string[] = [];
        if (isBlank(course.instructor)) miss.push("Persona que imparte");
        if (isBlank(course.organizingLab)) miss.push("Laboratorio que organiza");
        if (isBlank(course.contactEmail)) miss.push("Correo de contacto");
        return miss;
      }
      case "sesiones": {
        const miss: string[] = [];
        if (!course.sessionsCount || course.sessionsCount < 1) miss.push("Número de sesiones");
        if (!course.hoursPerSession || course.hoursPerSession < 1) miss.push("Horas por sesión");
        return miss;
      }
      case "logistica": {
        const miss: string[] = [];
        if (isBlank(course.place)) miss.push("Lugar");
        if (isBlank(course.modality)) miss.push("Modalidad");
        return miss;
      }
      case "contenido": {
        const miss: string[] = [];
        if (isBlank(course.objective)) miss.push("Objetivo");
        if (isBlank(course.justification)) miss.push("Justificación");
        if (isBlank(course.syllabus)) miss.push("Temario");
        if (isBlank(course.entryProfile)) miss.push("Perfil de ingreso");
        if (isBlank(course.attendees)) miss.push("Número de asistentes");
        if (isBlank(course.materials)) miss.push("Materiales solicitados");
        return miss;
      }
      case "difusion": {
        const miss: string[] = [];
        if (isBlank(course.bio)) miss.push("Semblanza");
        if (isBlank(course.registrationConsiderations)) miss.push("Consideraciones extra (registro)");
        return miss;
      }
      default:
        return [];
    }
  }

  // artistic
  switch (stepId) {
    case "tipo": {
      const miss: string[] = [];
      if (isBlank(title)) miss.push("Título");
      return miss;
    }
    case "general": {
      const miss: string[] = [];
      if (isBlank(art.participants)) miss.push("Participantes");
      if (isBlank(art.organizingLab)) miss.push("Laboratorio que organiza");
      if (isBlank(art.cycleName)) miss.push("Nombre del ciclo");
      if (isBlank(art.collaboration)) miss.push("Actividad en colaboración");
      if (isBlank(art.description)) miss.push("Descripción");
      if (isBlank(art.modality)) miss.push("Modalidad");
      return miss;
    }
    case "logistica_art": {
      const miss: string[] = [];
      if (isBlank(art.dateAndTime)) miss.push("Fecha y horarios");
      if (isBlank(art.rehearsalSchedule)) miss.push("Ensayos (fecha y horarios)");
      if (isBlank(art.setupSchedule)) miss.push("Montaje (fecha y horarios)");
      if (isBlank(art.place)) miss.push("Lugar");
      return miss;
    }
    case "difusion_art": {
      const miss: string[] = [];
      if (isBlank(art.bio)) miss.push("Semblanza");
      return miss;
    }
    default:
      return [];
  }
}

function setLiteSession(s: SessionLite, patch: Partial<SessionLite>): SessionLite {
  return { ...s, ...patch };
}

export function WizardPage() {
  const nav = useNavigate();
  const auth = loadAuth();

  const [kind, setKind] = useState<ActivityType>("course");
  const [title, setTitle] = useState("");

  const [course, setCourse] = useState<CourseActivity>(() => ({ ...defaultCourseActivity }));
  const [art, setArt] = useState<ArtisticActivity>(() => ({ ...defaultArtisticActivity }));

  const steps = useMemo((): { id: StepId; label: string }[] => {
    if (kind === "course") {
      return [
        { id: "tipo", label: "Tipo de ficha" },
        { id: "contacto", label: "Contacto" },
        { id: "sesiones", label: "Sesiones" },
        { id: "logistica", label: "Logística" },
        { id: "contenido", label: "Contenido" },
        { id: "difusion", label: "Difusión" },
        { id: "preview", label: "Previsualizar" },
      ];
    }

    return [
      { id: "tipo", label: "Tipo de ficha" },
      { id: "general", label: "General" },
      { id: "logistica_art", label: "Logística" },
      { id: "difusion_art", label: "Difusión" },
      { id: "preview", label: "Previsualizar" },
    ];
  }, [kind]);

  const [stepIndex, setStepIndex] = useState(0);
  const [warned, setWarned] = useState<Record<string, boolean>>({});
  const [warning, setWarning] = useState<string>("");

  useEffect(() => {
    if (!auth) nav("/login");
  }, [auth, nav]);

  // keep stepIndex in bounds when kind changes
  useEffect(() => {
    setStepIndex(0);
    setWarned({});
    setWarning("");

    // reset models for a clean wizard
    if (kind === "course") setCourse({ ...defaultCourseActivity });
    else setArt({ ...defaultArtisticActivity });
    setTitle("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  // Keep title in the model (for preview consistency)
  useEffect(() => {
    if (kind === "course") setCourse((c) => ({ ...c, title }));
    else setArt((a) => ({ ...a, title }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // Normalize sessions when counts change
  useEffect(() => {
    if (kind !== "course") return;
    setCourse((c) => {
      const n = Math.max(1, c.sessionsCount || 1);
      const h = Math.max(1, c.hoursPerSession || 1);
      const sessions = normalizeLiteSessions(c.sessions, n, h);
      // ensure durationHours has a sane default
      const fixed = sessions.map((s) => ({ ...s, durationHours: s.durationHours || h }));
      return { ...c, sessionsCount: n, hoursPerSession: h, sessions: fixed };
    });
  }, [kind, course.sessionsCount, course.hoursPerSession]);

  if (!auth) return null;

  const step = steps[stepIndex];

  function maybeWarnOnNext() {
    const miss = warningForStep(kind, step.id, title, course, art);
    if (miss.length === 0) return;

    const key = `${kind}:${step.id}`;
    if (warned[key]) return;

    setWarned((w) => ({ ...w, [key]: true }));
    setWarning(`Te faltan: ${miss.join(", ")}. Puedes continuar.`);
    setTimeout(() => setWarning(""), 3500);
  }

  function next() {
    maybeWarnOnNext();
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  }

  function prev() {
    setWarning("");
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function makeDraftDoc(): ActivityDoc {
    if (kind === "course") {
      const n = Math.max(1, course.sessionsCount || 1);
      const h = Math.max(1, course.hoursPerSession || 1);
      const sessions = normalizeLiteSessions(course.sessions, n, h);
      return {
        kind: "course",
        activity: { ...course, title: title.trim(), sessionsCount: n, hoursPerSession: h, sessions },
      };
    }

    return {
      kind: "artistic",
      activity: { ...art, title: title.trim() },
    };
  }

  const draft = makeDraftDoc();

  const missingForSubmit = validateForSubmission(draft);

  function createAndGoToView() {
    if (!auth) return;
    const doc = makeDraftDoc();
    createDoc(auth.userId, doc);
    nav("/view");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Creador de ficha</h1>
          <div className="mt-1 text-sm text-slate-600">Paso {stepIndex + 1} de {steps.length}: <b>{step.label}</b></div>
        </div>
        <Link
          to="/"
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
        >
          Menú
        </Link>
      </div>

      {warning ? (
        <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">{warning}</div>
      ) : null}

      <div className="mt-6">
        <StepCard
          title={step.label}
          stepText={`Paso ${stepIndex + 1}/${steps.length}`}
          subtitle={
            step.id === "tipo"
              ? "Selecciona el tipo de ficha y el título."
              : step.id === "sesiones"
                ? "Define cuántas sesiones y completa el programa por sesión."
                : step.id === "preview"
                  ? "Revisa la ficha y crea un borrador."
                  : "Completa la información de esta sección."
          }
        >
          {step.id === "tipo" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={<>Tipo de ficha<HelpTip text="Selecciona el tipo de ficha. Esto define las secciones que verás después." /></>}>
                <select
                  className={inputCls}
                  value={kind}
                  onChange={(e) => setKind(e.target.value as ActivityType)}
                >
                  <option value="course">Ficha académica (Taller/Curso)</option>
                  <option value="artistic">Ficha de actividad artística</option>
                </select>
              </Field>

              <Field label={<>Título<HelpTip text="Nombre de la actividad. Se usa en la ficha y exportaciones." /></>}>
                <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Taller de Electrónica" />
              </Field>

              {kind === "course" ? (
                <Field
                  label={
                    <>
                      Tipo (curso/taller/seminario)
                      <HelpTip text="Taller: aprendizaje práctico y aplicado. Curso: formación estructurada. Seminario: profundización y discusión guiada." />
                    </>
                  }
                >
                  <select
                    className={inputCls}
                    value={course.typeLabel}
                    onChange={(e) => setCourse((c) => ({ ...c, typeLabel: e.target.value as any }))}
                  >
                    <option value="">—</option>
                    <option value="Taller">Taller</option>
                    <option value="Curso">Curso</option>
                    <option value="Seminario">Seminario</option>
                  </select>
                </Field>
              ) : null}
            </div>
          ) : null}

          {kind === "course" && step.id === "contacto" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Persona que imparte">
                <input className={inputCls} value={course.instructor} onChange={(e) => setCourse((c) => ({ ...c, instructor: e.target.value }))} />
              </Field>
              <Field label={<>Laboratorio que organiza<HelpTip text="Selecciona el laboratorio responsable." /></>}>
                <select
                  className={inputCls}
                  value={course.organizingLab}
                  onChange={(e) => setCourse((c) => ({ ...c, organizingLab: e.target.value }))}
                >
                  <option value="">—</option>
                  {LAB_OPTIONS.map((lab) => (
                    <option key={lab} value={lab}>
                      {lab}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Correo de contacto">
                <input className={inputCls} value={course.contactEmail} onChange={(e) => setCourse((c) => ({ ...c, contactEmail: e.target.value }))} />
              </Field>
            </div>
          ) : null}

          {kind === "course" && step.id === "sesiones" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Número de sesiones">
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={course.sessionsCount}
                    onChange={(e) => setCourse((c) => ({ ...c, sessionsCount: Math.max(1, Number(e.target.value || 1)) }))}
                  />
                </Field>
                <Field label="Horas por sesión">
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={course.hoursPerSession}
                    onChange={(e) => setCourse((c) => ({ ...c, hoursPerSession: Math.max(1, Number(e.target.value || 1)) }))}
                  />
                </Field>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-black/5">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="text-sm font-semibold text-slate-900">Programa por sesiones</div>
                  <div className="text-xs text-slate-600">Opcional: puedes completar todo aquí o después en el editor</div>
                </div>
                <div className="mt-4 space-y-3">
                  {course.sessions
                    .slice()
                    .sort((a, b) => a.index - b.index)
                    .map((s) => (
                      <div key={s.index} className="rounded-2xl bg-white px-4 py-4 ring-1 ring-black/5">
                        <div className="text-xs font-semibold text-slate-600">Sesión {s.index}</div>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="block sm:col-span-2">
                            <div className="mb-1 text-sm font-medium text-slate-700">Título de la sesión</div>
                            <input
                              className={inputCls}
                              value={s.title ?? ""}
                              onChange={(e) =>
                                setCourse((c) => ({
                                  ...c,
                                  sessions: c.sessions.map((it) => (it.index === s.index ? setLiteSession(it, { title: e.target.value }) : it)),
                                }))
                              }
                              placeholder="Ej. Introducción / Módulo 1"
                            />
                          </label>

                          <label className="block">
                            <div className="mb-1 text-sm font-medium text-slate-700">Fecha</div>
                            <DatePickerField
                              valueISO={s.dateISO}
                              onChangeISO={(iso) =>
                                setCourse((c) => ({
                                  ...c,
                                  sessions: c.sessions.map((it) => (it.index === s.index ? setLiteSession(it, { dateISO: iso }) : it)),
                                }))
                              }
                            />
                          </label>

                          <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                              <div className="mb-1 text-sm font-medium text-slate-700">Inicio</div>
                              <input
                                type="time"
                                className={inputCls}
                                value={s.startTime}
                                onChange={(e) =>
                                  setCourse((c) => ({
                                    ...c,
                                    sessions: c.sessions.map((it) => (it.index === s.index ? setLiteSession(it, { startTime: e.target.value }) : it)),
                                  }))
                                }
                              />
                            </label>
                            <label className="block">
                              <div className="mb-1 text-sm font-medium text-slate-700">Fin</div>
                              <input
                                type="time"
                                className={inputCls}
                                value={s.endTime}
                                onChange={(e) =>
                                  setCourse((c) => ({
                                    ...c,
                                    sessions: c.sessions.map((it) => (it.index === s.index ? setLiteSession(it, { endTime: e.target.value }) : it)),
                                  }))
                                }
                              />
                            </label>
                          </div>

                          <label className="block">
                            <div className="mb-1 text-sm font-medium text-slate-700">Duración (horas)</div>
                            <input
                              type="number"
                              min={0.5}
                              step={0.5}
                              className={inputCls}
                              value={s.durationHours}
                              onChange={(e) =>
                                setCourse((c) => ({
                                  ...c,
                                  sessions: c.sessions.map((it) => (it.index === s.index ? setLiteSession(it, { durationHours: Number(e.target.value || c.hoursPerSession || 1) }) : it)),
                                }))
                              }
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : null}

          {kind === "course" && step.id === "logistica" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label={
                  <>
                    Horario de las sesiones
                    <HelpTip text="Si todas las sesiones tienen el mismo horario, puedes capturarlo aquí. Si varía, lo capturas por sesión en el paso de Sesiones." />
                  </>
                }
              >
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={(course.scheduleMode ?? "VARIABLE") === "SAME"}
                      onChange={() => setCourse((c) => ({ ...c, scheduleMode: "SAME" }))}
                    />
                    Mismo horario para todas las sesiones
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={(course.scheduleMode ?? "VARIABLE") === "VARIABLE"}
                      onChange={() => setCourse((c) => ({ ...c, scheduleMode: "VARIABLE" }))}
                    />
                    Horario variable (se define por sesión)
                  </label>

                  {(course.scheduleMode ?? "VARIABLE") === "SAME" ? (
                    <DateTimeRangeField
                      value={course.dateAndTime}
                      onChange={(v) => setCourse((c) => ({ ...c, dateAndTime: v }))}
                      dateLabel="Fecha (opcional)"
                    />
                  ) : (
                    <div className="text-sm text-slate-600">Tip: completa fechas/horarios en el paso “Sesiones”.</div>
                  )}
                </div>
              </Field>

              <Field label={<>Lugar<HelpTip text="Sede o ubicación." /></>}>
                <input className={inputCls} value={course.place} onChange={(e) => setCourse((c) => ({ ...c, place: e.target.value }))} />
              </Field>

              <Field label={<>Modalidad<HelpTip text="Presencial / En línea / Híbrida." /></>}>
                <select
                  className={inputCls}
                  value={course.modality}
                  onChange={(e) => setCourse((c) => ({ ...c, modality: e.target.value as any }))}
                >
                  <option value="">—</option>
                  <option value="Presencial">Presencial</option>
                  <option value="En línea">En línea</option>
                  <option value="Híbrida">Híbrida</option>
                </select>
              </Field>

              <Field label={<>Serie / ciclo<HelpTip text="Si la actividad pertenece a una serie o ciclo, anótalo aquí." /></>}>
                <input className={inputCls} value={course.seriesInfo} onChange={(e) => setCourse((c) => ({ ...c, seriesInfo: e.target.value }))} placeholder="Ej. Ciclo de iniciación" />
              </Field>

              <Field label={<>Colaboración<HelpTip text="Si es en colaboración con otra área/instancia, indícalo aquí." /></>}>
                <input className={inputCls} value={course.collaboration} onChange={(e) => setCourse((c) => ({ ...c, collaboration: e.target.value }))} placeholder="Ej. Con Laboratorio X" />
              </Field>

              <div className="sm:col-span-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-black/5">
                  <div className="text-sm font-semibold text-slate-900">Requerimientos técnicos</div>
                  <div className="mt-1 text-xs text-slate-600">Lo que necesitas para que el curso suceda (si no aplica, pon N/A).</div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Internet">
                      <input className={inputCls} value={course.tech.internet} onChange={(e) => setCourse((c) => ({ ...c, tech: { ...c.tech, internet: e.target.value } }))} />
                    </Field>
                    <Field label="Montaje">
                      <input className={inputCls} value={course.tech.setup} onChange={(e) => setCourse((c) => ({ ...c, tech: { ...c.tech, setup: e.target.value } }))} />
                    </Field>
                    <Field label="Transmisión">
                      <input className={inputCls} value={course.tech.broadcast} onChange={(e) => setCourse((c) => ({ ...c, tech: { ...c.tech, broadcast: e.target.value } }))} />
                    </Field>
                    <Field label="Proyección/Audio">
                      <input className={inputCls} value={course.tech.projectionAudio} onChange={(e) => setCourse((c) => ({ ...c, tech: { ...c.tech, projectionAudio: e.target.value } }))} />
                    </Field>
                    <Field label="Otros">
                      <input className={inputCls} value={course.tech.other} onChange={(e) => setCourse((c) => ({ ...c, tech: { ...c.tech, other: e.target.value } }))} />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {kind === "course" && step.id === "contenido" ? (
            <div className="grid grid-cols-1 gap-4">
              <Field label="Objetivo">
                <textarea className={textareaCls} rows={3} value={course.objective} onChange={(e) => setCourse((c) => ({ ...c, objective: e.target.value }))} />
              </Field>
              <Field label={<>Justificación<HelpTip text="Explica por qué esta actividad es necesaria: pertinencia, problema que atiende, contexto y público." /></>}>
                <textarea className={textareaCls} rows={3} value={course.justification} onChange={(e) => setCourse((c) => ({ ...c, justification: e.target.value }))} />
              </Field>
              <Field label={<>Temario<HelpTip text="Lista de temas a cubrir (puede ser por módulos o por bloques)." /></>}>
                <textarea className={textareaCls} rows={4} value={course.syllabus} onChange={(e) => setCourse((c) => ({ ...c, syllabus: e.target.value }))} />
              </Field>

              <Field label={<>Metodología<HelpTip text="Describe cómo se trabajará: dinámicas, estructura, ejercicios, recursos y modalidad." /></>}>
                <textarea className={textareaCls} rows={3} value={course.methodology} onChange={(e) => setCourse((c) => ({ ...c, methodology: e.target.value }))} />
              </Field>
              <Field label="Perfil de ingreso">
                <textarea className={textareaCls} rows={3} value={course.entryProfile} onChange={(e) => setCourse((c) => ({ ...c, entryProfile: e.target.value }))} />
              </Field>
              <Field label="Número de asistentes">
                <textarea className={textareaCls} rows={2} value={course.attendees} onChange={(e) => setCourse((c) => ({ ...c, attendees: e.target.value }))} />
              </Field>
              <Field label="Materiales solicitados">
                <textarea className={textareaCls} rows={2} value={course.materials} onChange={(e) => setCourse((c) => ({ ...c, materials: e.target.value }))} />
              </Field>
              <Field label={<>Cuota de recuperación<HelpTip text="Si no aplica, pon N/A o deja en blanco." /></>}>
                <input className={inputCls} value={course.materialFee} onChange={(e) => setCourse((c) => ({ ...c, materialFee: e.target.value }))} placeholder="Ej. $500 / N/A" />
              </Field>
            </div>
          ) : null}

          {kind === "course" && step.id === "difusion" ? (
            <div className="grid grid-cols-1 gap-4">
              <Field label={<>Líneas fuerza<HelpTip text="Frases/ideas clave para la promoción." /></>}>
                <textarea className={textareaCls} rows={3} value={course.promoLines} onChange={(e) => setCourse((c) => ({ ...c, promoLines: e.target.value }))} />
              </Field>
              <Field label={<>Recursos para atención al público<HelpTip text="Info útil para responder dudas: requisitos, qué traer, a quién va dirigido, etc." /></>}>
                <textarea className={textareaCls} rows={3} value={course.audienceResources} onChange={(e) => setCourse((c) => ({ ...c, audienceResources: e.target.value }))} />
              </Field>
              <Field label={<>Palabras clave<HelpTip text="Separadas por coma." /></>}>
                <input className={inputCls} value={course.keywords} onChange={(e) => setCourse((c) => ({ ...c, keywords: e.target.value }))} placeholder="Ej. electrónica, sensores, danza" />
              </Field>

              <Field label="Semblanza">
                <textarea className={textareaCls} rows={3} value={course.bio} onChange={(e) => setCourse((c) => ({ ...c, bio: e.target.value }))} />
              </Field>
              <Field label="Consideraciones extra (registro)">
                <textarea
                  className={textareaCls}
                  rows={3}
                  value={course.registrationConsiderations}
                  onChange={(e) => setCourse((c) => ({ ...c, registrationConsiderations: e.target.value }))}
                />
              </Field>

              <Field label={<>Campos internos (no aparecen en la ficha)<HelpTip text="Notas para el equipo. Esto no se imprime." /></>}>
                <textarea className={textareaCls} rows={3} value={course.internalNotes || ""} onChange={(e) => setCourse((c) => ({ ...c, internalNotes: e.target.value }))} />
              </Field>
            </div>
          ) : null}

          {kind === "artistic" && step.id === "general" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Participantes">
                <input className={inputCls} value={art.participants} onChange={(e) => setArt((a) => ({ ...a, participants: e.target.value }))} />
              </Field>
              <Field label={<>Laboratorio que organiza<HelpTip text="Selecciona el laboratorio responsable." /></>}>
                <select
                  className={inputCls}
                  value={art.organizingLab}
                  onChange={(e) => setArt((a) => ({ ...a, organizingLab: e.target.value }))}
                >
                  <option value="">—</option>
                  {LAB_OPTIONS.map((lab) => (
                    <option key={lab} value={lab}>
                      {lab}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nombre del ciclo">
                <input className={inputCls} value={art.cycleName} onChange={(e) => setArt((a) => ({ ...a, cycleName: e.target.value }))} />
              </Field>
              <Field label="Actividad en colaboración">
                <input className={inputCls} value={art.collaboration} onChange={(e) => setArt((a) => ({ ...a, collaboration: e.target.value }))} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Descripción">
                  <textarea className={textareaCls} rows={4} value={art.description} onChange={(e) => setArt((a) => ({ ...a, description: e.target.value }))} />
                </Field>
              </div>
              <Field label="Modalidad">
                <select className={inputCls} value={art.modality} onChange={(e) => setArt((a) => ({ ...a, modality: e.target.value as any }))}>
                  <option value="">—</option>
                  <option value="Presencial">Presencial</option>
                  <option value="En línea">En línea</option>
                  <option value="Híbrida">Híbrida</option>
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label={<>Campos internos (no aparecen en la ficha)<HelpTip text="Notas para el equipo. Esto no se imprime." /></>}>
                  <textarea className={textareaCls} rows={3} value={art.internalNotes || ""} onChange={(e) => setArt((a) => ({ ...a, internalNotes: e.target.value }))} />
                </Field>
              </div>
            </div>
          ) : null}

          {kind === "artistic" && step.id === "logistica_art" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={<>Fecha y horarios<HelpTip text="Fecha y horario general de la actividad." /></>}>
                <DateTimeRangeField value={art.dateAndTime} onChange={(v) => setArt((a) => ({ ...a, dateAndTime: v }))} />
              </Field>
              <Field label={<>Ensayos (fecha y horarios)<HelpTip text="Si aplica, fecha y horario de ensayos." /></>}>
                <DateTimeRangeField value={art.rehearsalSchedule} onChange={(v) => setArt((a) => ({ ...a, rehearsalSchedule: v }))} />
              </Field>
              <Field label={<>Montaje (fecha y horarios)<HelpTip text="Si aplica, fecha y horario de montaje." /></>}>
                <DateTimeRangeField value={art.setupSchedule} onChange={(v) => setArt((a) => ({ ...a, setupSchedule: v }))} />
              </Field>
              <Field label="Lugar">
                <input className={inputCls} value={art.place} onChange={(e) => setArt((a) => ({ ...a, place: e.target.value }))} />
              </Field>
              <Field label={<>Particularidades<HelpTip text="Cosas a considerar: accesibilidad, restricciones, montaje especial, etc." /></>}>
                <input className={inputCls} value={art.particularities} onChange={(e) => setArt((a) => ({ ...a, particularities: e.target.value }))} />
              </Field>

              <div className="sm:col-span-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-black/5">
                  <div className="text-sm font-semibold text-slate-900">Requerimientos técnicos</div>
                  <div className="mt-1 text-xs text-slate-600">Lo que necesitas para que la actividad suceda (si no aplica, pon N/A).</div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Internet">
                      <input className={inputCls} value={art.tech.internet} onChange={(e) => setArt((a) => ({ ...a, tech: { ...a.tech, internet: e.target.value } }))} />
                    </Field>
                    <Field label="Montaje">
                      <input className={inputCls} value={art.tech.setup} onChange={(e) => setArt((a) => ({ ...a, tech: { ...a.tech, setup: e.target.value } }))} />
                    </Field>
                    <Field label="Ensayos">
                      <input className={inputCls} value={art.tech.rehearsal} onChange={(e) => setArt((a) => ({ ...a, tech: { ...a.tech, rehearsal: e.target.value } }))} />
                    </Field>
                    <Field label="Transmisión">
                      <input className={inputCls} value={art.tech.broadcast} onChange={(e) => setArt((a) => ({ ...a, tech: { ...a.tech, broadcast: e.target.value } }))} />
                    </Field>
                    <Field label="Proyección/Audio">
                      <input className={inputCls} value={art.tech.projectionAudio} onChange={(e) => setArt((a) => ({ ...a, tech: { ...a.tech, projectionAudio: e.target.value } }))} />
                    </Field>
                    <Field label="Otros">
                      <input className={inputCls} value={art.tech.other} onChange={(e) => setArt((a) => ({ ...a, tech: { ...a.tech, other: e.target.value } }))} />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {kind === "artistic" && step.id === "difusion_art" ? (
            <div className="grid grid-cols-1 gap-4">
              <Field label={<>Líneas fuerza<HelpTip text="Frases/ideas clave para la promoción." /></>}>
                <textarea className={textareaCls} rows={3} value={art.promoLines} onChange={(e) => setArt((a) => ({ ...a, promoLines: e.target.value }))} />
              </Field>
              <Field label={<>Recursos para atención al público<HelpTip text="Info útil para responder dudas: requisitos, qué traer, a quién va dirigido, etc." /></>}>
                <textarea className={textareaCls} rows={3} value={art.audienceResources} onChange={(e) => setArt((a) => ({ ...a, audienceResources: e.target.value }))} />
              </Field>
              <Field label={<>Palabras clave<HelpTip text="Separadas por coma." /></>}>
                <input className={inputCls} value={art.keywords} onChange={(e) => setArt((a) => ({ ...a, keywords: e.target.value }))} placeholder="Ej. performance, música, instalación" />
              </Field>

              <Field label="Semblanza">
                <textarea className={textareaCls} rows={3} value={art.bio} onChange={(e) => setArt((a) => ({ ...a, bio: e.target.value }))} />
              </Field>
            </div>
          ) : null}

          {step.id === "preview" ? (
            <div>
              <div className={
                "rounded-2xl px-4 py-3 text-sm ring-1 " +
                (missingForSubmit.length === 0
                  ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
                  : "bg-amber-50 text-amber-900 ring-amber-200")
              }>
                {missingForSubmit.length === 0 ? (
                  <div><b>Listo para enviar a validación</b> (cuando termines de editar).</div>
                ) : (
                  <div>
                    <b>Faltan campos obligatorios para enviar a validación:</b>
                    <ul className="mt-2 list-disc pl-5">
                      {missingForSubmit.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-6">
                {draft.kind === "course" ? (
                  <CourseCard activity={draft.activity} />
                ) : draft.kind === "artistic" ? (
                  <ArtisticCard activity={draft.activity} />
                ) : null}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  onClick={createAndGoToView}
                >
                  Crear ficha
                </button>
                <div className="mt-2 text-xs text-slate-500">
                  Te llevará a la vista de la ficha. Desde ahí podrás <b>Editar</b> o <b>Enviar a validación</b>.
                </div>
              </div>
            </div>
          ) : null}
        </StepCard>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50 disabled:opacity-50"
          onClick={prev}
          disabled={stepIndex === 0}
        >
          Anterior
        </button>

        <div className="text-xs text-slate-500">
          {steps.map((s, i) => (
            <span key={s.id} className={"inline-block h-2 w-2 rounded-full mr-1 " + (i === stepIndex ? "bg-indigo-600" : "bg-slate-200")} />
          ))}
        </div>

        <button
          type="button"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          onClick={next}
          disabled={stepIndex >= steps.length - 1}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2";
const textareaCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2";
