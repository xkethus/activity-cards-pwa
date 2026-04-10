import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadAuth } from "../lib/auth";
import { createDoc } from "../lib/db";
import type { ActivityDoc, ActivityType, ArtisticActivity, CourseActivity, SessionLite } from "../lib/types";
import { defaultArtisticActivity, defaultCourseActivity } from "../lib/defaultProgram";
import { normalizeLiteSessions } from "../lib/courseSessions";

import { CourseCard } from "../components/CourseCard";
import { ArtisticCard } from "../components/ArtisticCard";
import { DateTimeRangeField } from "../components/DateTimeRangeField";
import { DatePickerField } from "../components/DatePickerField";
import { LAB_OPTIONS } from "../lib/labs";
import { HelpTip } from "../components/Tooltip";
import { StepCard } from "../components/StepCard";
import { DotNav } from "../components/DotNav";
import type { DotStatus } from "../components/DotNav";

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
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [warning, setWarning] = useState<string>("");

  useEffect(() => {
    if (!auth) nav("/login");
  }, [auth, nav]);

  // keep stepIndex in bounds when kind changes
  useEffect(() => {
    setStepIndex(0);
    setVisited(new Set());
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

  // Compute DotNav status for each step
  function getStepStatus(s: { id: StepId }): DotStatus {
    if (!visited.has(s.id)) return "empty";
    const miss = warningForStep(kind, s.id, title, course, art);
    return miss.length === 0 ? "ok" : "partial";
  }

  const dotItems = steps.map((s) => ({
    id: s.id,
    label: s.label,
    status: getStepStatus(s),
  }));

  function maybeWarnOnNext() {
    const miss = warningForStep(kind, step.id, title, course, art);
    if (miss.length === 0) {
      setWarning("");
      return;
    }
    setWarning(`Campos pendientes: ${miss.join(", ")}. Puedes continuar o volver a completarlos.`);
    setTimeout(() => setWarning(""), 4000);
  }

  function next() {
    setVisited((v) => new Set(v).add(step.id));
    maybeWarnOnNext();
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  }

  function prev() {
    setVisited((v) => new Set(v).add(step.id));
    setWarning("");
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function goToStep(id: string) {
    setVisited((v) => new Set(v).add(step.id));
    const idx = steps.findIndex((s) => s.id === id);
    if (idx >= 0) setStepIndex(idx);
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

  // Group missing fields by step for the preview panel
  const missingByStep: { stepId: StepId; stepLabel: string; fields: string[] }[] = steps
    .filter((s) => s.id !== "preview")
    .map((s) => ({
      stepId: s.id,
      stepLabel: s.label,
      fields: warningForStep(kind, s.id, title, course, art),
    }))
    .filter((x) => x.fields.length > 0);

  function createAndGoToView() {
    if (!auth) return;
    const doc = makeDraftDoc();
    createDoc(auth.userId, doc);
    nav("/view");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Creador de ficha</h1>
          <div className="mt-1 text-sm text-slate-600">
            Paso {stepIndex + 1} de {steps.length}: <b>{step.label}</b>
          </div>
        </div>
        <Link
          to="/"
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
        >
          Menú
        </Link>
      </div>

      {/* ── Warning banner ── */}
      {warning ? (
        <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {warning}
        </div>
      ) : null}

      {/* ── Mobile DotNav: horizontal strip, in normal flow (no sticky) ── */}
      <div className="mt-4 sm:hidden">
        <DotNav items={dotItems} activeId={step.id} onSelect={goToStep} />
      </div>

      {/* ── Desktop: sidebar grid ── */}
      <div className="mt-6 grid grid-cols-1 items-start gap-6 sm:grid-cols-[224px_1fr]">
        {/* Desktop sidebar nav (hidden on mobile — rendered above instead) */}
        <div className="hidden sm:block">
          <DotNav items={dotItems} activeId={step.id} onSelect={goToStep} />
        </div>

        {/* Main content */}
        <div>
          <StepCard
            title={step.label}
            stepText={`Paso ${stepIndex + 1}/${steps.length}`}
            subtitle={
              step.id === "tipo"
                ? "Selecciona el tipo de ficha y el título."
                : step.id === "sesiones"
                  ? "Define cuántas sesiones y completa el programa por sesión."
                  : step.id === "preview"
                    ? "Revisa la ficha y guárdala como borrador."
                    : "Completa la información de esta sección."
            }
          >
            {/* ── STEP: TIPO ── */}
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

                <Field label={<><Req />Título<HelpTip text="Nombre de la actividad. Se usa en la ficha y exportaciones." /></>}>
                  <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Taller de Electrónica" />
                </Field>

                {kind === "course" ? (
                  <Field
                    label={
                      <>
                        <Req />Tipo (curso/taller/seminario)
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

            {/* ── STEP: CONTACTO ── */}
            {kind === "course" && step.id === "contacto" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={<><Req />Persona que imparte</>}>
                  <input className={inputCls} value={course.instructor} onChange={(e) => setCourse((c) => ({ ...c, instructor: e.target.value }))} placeholder="Nombre completo" />
                </Field>
                <Field label={<><Req />Laboratorio que organiza<HelpTip text="Selecciona el laboratorio responsable." /></>}>
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
                <Field label={<><Req />Correo de contacto</>}>
                  <input className={inputCls} value={course.contactEmail} onChange={(e) => setCourse((c) => ({ ...c, contactEmail: e.target.value }))} placeholder="correo@ejemplo.com" />
                </Field>
              </div>
            ) : null}

            {/* ── STEP: SESIONES ── */}
            {kind === "course" && step.id === "sesiones" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={<><Req />Número de sesiones</>}>
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={course.sessionsCount}
                      onChange={(e) => setCourse((c) => ({ ...c, sessionsCount: Math.max(1, Number(e.target.value || 1)) }))}
                    />
                  </Field>
                  <Field label={<><Req />Horas por sesión</>}>
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

            {/* ── STEP: LOGÍSTICA (course) ── */}
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
                        checked={(course.scheduleMode ?? "SAME") === "SAME"}
                        onChange={() => setCourse((c) => ({ ...c, scheduleMode: "SAME" }))}
                      />
                      Mismo horario para todas las sesiones
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="scheduleMode"
                        checked={(course.scheduleMode ?? "SAME") === "VARIABLE"}
                        onChange={() => setCourse((c) => ({ ...c, scheduleMode: "VARIABLE" }))}
                      />
                      Horario variable (se define por sesión)
                    </label>

                    {(course.scheduleMode ?? "SAME") === "SAME" ? (
                      <DateTimeRangeField
                        value={course.dateAndTime}
                        onChange={(v) => setCourse((c) => ({ ...c, dateAndTime: v }))}
                        dateLabel="Fecha (opcional)"
                      />
                    ) : (
                      <div className="text-sm text-slate-600">Tip: completa fechas/horarios en el paso "Sesiones".</div>
                    )}
                  </div>
                </Field>

                <Field label={<><Req />Lugar<HelpTip text="Sede o ubicación." /></>}>
                  <input className={inputCls} value={course.place} onChange={(e) => setCourse((c) => ({ ...c, place: e.target.value }))} placeholder="Ej. Sala A / Centro Cultural" />
                </Field>

                <Field label={<><Req />Modalidad<HelpTip text="Presencial / En línea / Híbrida." /></>}>
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
                        <input className={inputCls} value={course.tech.internet} onChange={(e) => setCourse((c) => ({ ...c, tech: { ...c.tech, internet: e.target.value } }))} placeholder="Ej. 50 Mbps / N/A" />
                      </Field>
                      <Field label="Montaje">
                        <input className={inputCls} value={course.tech.setup} onChange={(e) => setCourse((c) => ({ ...c, tech: { ...c.tech, setup: e.target.value } }))} placeholder="Ej. Sillas para 20 / N/A" />
                      </Field>
                      <Field label="Transmisión">
                        <input className={inputCls} value={course.tech.broadcast} onChange={(e) => setCourse((c) => ({ ...c, tech: { ...c.tech, broadcast: e.target.value } }))} placeholder="Ej. Zoom / N/A" />
                      </Field>
                      <Field label="Proyección/Audio">
                        <input className={inputCls} value={course.tech.projectionAudio} onChange={(e) => setCourse((c) => ({ ...c, tech: { ...c.tech, projectionAudio: e.target.value } }))} placeholder="Ej. Proyector HD + bocinas / N/A" />
                      </Field>
                      <Field label="Otros">
                        <input className={inputCls} value={course.tech.other} onChange={(e) => setCourse((c) => ({ ...c, tech: { ...c.tech, other: e.target.value } }))} placeholder="Ej. Mesa de trabajo / N/A" />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ── STEP: CONTENIDO ── */}
            {kind === "course" && step.id === "contenido" ? (
              <div className="space-y-6">
                {/* Esenciales */}
                <div>
                  <SectionHeader title="Información esencial" description="Estos campos son obligatorios para enviar la ficha a validación." />
                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <Field label={<><Req />Objetivo</>}>
                      <textarea className={textareaCls} rows={3} value={course.objective} onChange={(e) => setCourse((c) => ({ ...c, objective: e.target.value }))} placeholder="¿Qué sabrá o podrá hacer el participante al terminar?" />
                    </Field>
                    <Field label={<><Req />Justificación<HelpTip text="Explica por qué esta actividad es necesaria: pertinencia, problema que atiende, contexto y público." /></>}>
                      <textarea className={textareaCls} rows={3} value={course.justification} onChange={(e) => setCourse((c) => ({ ...c, justification: e.target.value }))} placeholder="¿Por qué es pertinente esta actividad? ¿A qué necesidad responde?" />
                    </Field>
                    <Field label={<><Req />Temario<HelpTip text="Lista de temas a cubrir (puede ser por módulos o por bloques)." /></>}>
                      <textarea className={textareaCls} rows={4} value={course.syllabus} onChange={(e) => setCourse((c) => ({ ...c, syllabus: e.target.value }))} placeholder="Sesión 1: Introducción&#10;Sesión 2: Fundamentos&#10;Sesión 3: Práctica..." />
                    </Field>
                    <Field label={<><Req />Perfil de ingreso</>}>
                      <textarea className={textareaCls} rows={3} value={course.entryProfile} onChange={(e) => setCourse((c) => ({ ...c, entryProfile: e.target.value }))} placeholder="¿A quién va dirigido? Conocimientos previos, edad, perfil esperado." />
                    </Field>
                    <Field label={<><Req />Número de asistentes</>}>
                      <textarea className={textareaCls} rows={2} value={course.attendees} onChange={(e) => setCourse((c) => ({ ...c, attendees: e.target.value }))} placeholder="Ej. Mínimo 10, máximo 25 personas" />
                    </Field>
                    <Field label={<><Req />Materiales solicitados</>}>
                      <textarea className={textareaCls} rows={2} value={course.materials} onChange={(e) => setCourse((c) => ({ ...c, materials: e.target.value }))} placeholder="Ej. Laptop con Python instalado, libreta de notas" />
                    </Field>
                  </div>
                </div>

                {/* Complementarios */}
                <div>
                  <SectionHeader title="Información complementaria" description="Opcional, pero enriquece la ficha." />
                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <Field label={<>Metodología<HelpTip text="Describe cómo se trabajará: dinámicas, estructura, ejercicios, recursos y modalidad." /></>}>
                      <textarea className={textareaCls} rows={3} value={course.methodology} onChange={(e) => setCourse((c) => ({ ...c, methodology: e.target.value }))} placeholder="Ej. Clases expositivas + ejercicios prácticos + proyecto final" />
                    </Field>
                    <Field label={<>Cuota de recuperación<HelpTip text="Si no aplica, pon N/A o deja en blanco." /></>}>
                      <input className={inputCls} value={course.materialFee} onChange={(e) => setCourse((c) => ({ ...c, materialFee: e.target.value }))} placeholder="Ej. $500 / N/A" />
                    </Field>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ── STEP: DIFUSIÓN (course) ── */}
            {kind === "course" && step.id === "difusion" ? (
              <div className="grid grid-cols-1 gap-4">
                <Field label={<>Líneas fuerza<HelpTip text="Frases/ideas clave para la promoción." /></>}>
                  <textarea
                    className={textareaCls}
                    rows={3}
                    value={course.promoLines}
                    onChange={(e) => setCourse((c) => ({ ...c, promoLines: e.target.value }))}
                    placeholder="Ej. Aprende electrónica aplicada al movimiento escénico. Sin conocimientos previos. Cupo limitado."
                  />
                </Field>
                <Field label={<>Recursos para atención al público<HelpTip text="Info útil para responder dudas: requisitos, qué traer, a quién va dirigido, etc." /></>}>
                  <textarea
                    className={textareaCls}
                    rows={3}
                    value={course.audienceResources}
                    onChange={(e) => setCourse((c) => ({ ...c, audienceResources: e.target.value }))}
                    placeholder="Ej. Abierto a mayores de 16 años. Se recomienda traer laptop. Sin costo de inscripción."
                  />
                </Field>
                <Field label={<>Palabras clave<HelpTip text="Separadas por coma. Se usan para búsqueda y categorización." /></>}>
                  <input
                    className={inputCls}
                    value={course.keywords}
                    onChange={(e) => setCourse((c) => ({ ...c, keywords: e.target.value }))}
                    placeholder="Ej. electrónica, sensores, danza, tecnología, interactividad"
                  />
                </Field>

                <Field label={<><Req />Semblanza</>}>
                  <textarea
                    className={textareaCls}
                    rows={3}
                    value={course.bio}
                    onChange={(e) => setCourse((c) => ({ ...c, bio: e.target.value }))}
                    placeholder="Breve bio de quien imparte: formación, proyectos destacados, vínculo con el tema."
                  />
                </Field>
                <Field label={<><Req />Consideraciones extra (registro)</>}>
                  <textarea
                    className={textareaCls}
                    rows={3}
                    value={course.registrationConsiderations}
                    onChange={(e) => setCourse((c) => ({ ...c, registrationConsiderations: e.target.value }))}
                    placeholder="Ej. Se requiere registro previo vía formulario. Cupo limitado: primeras 20 inscripciones confirmadas."
                  />
                </Field>

                <Field label={<>Campos internos (no aparecen en la ficha)<HelpTip text="Notas para el equipo. Esto no se imprime." /></>}>
                  <textarea className={textareaCls} rows={3} value={course.internalNotes || ""} onChange={(e) => setCourse((c) => ({ ...c, internalNotes: e.target.value }))} placeholder="Notas internas: pendientes, acuerdos, observaciones del equipo." />
                </Field>
              </div>
            ) : null}

            {/* ── STEP: GENERAL (artistic) ── */}
            {kind === "artistic" && step.id === "general" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={<><Req />Participantes</>}>
                  <input className={inputCls} value={art.participants} onChange={(e) => setArt((a) => ({ ...a, participants: e.target.value }))} placeholder="Ej. Compañía X, artistas invitados" />
                </Field>
                <Field label={<><Req />Laboratorio que organiza<HelpTip text="Selecciona el laboratorio responsable." /></>}>
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
                <Field label={<><Req />Nombre del ciclo</>}>
                  <input className={inputCls} value={art.cycleName} onChange={(e) => setArt((a) => ({ ...a, cycleName: e.target.value }))} placeholder="Ej. Ciclo de danza contemporánea" />
                </Field>
                <Field label={<><Req />Actividad en colaboración</>}>
                  <input className={inputCls} value={art.collaboration} onChange={(e) => setArt((a) => ({ ...a, collaboration: e.target.value }))} placeholder="Ej. Con Laboratorio de Sonido / N/A" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label={<><Req />Descripción</>}>
                    <textarea className={textareaCls} rows={4} value={art.description} onChange={(e) => setArt((a) => ({ ...a, description: e.target.value }))} placeholder="Descripción de la actividad artística: propuesta, intención y contexto." />
                  </Field>
                </div>
                <Field label={<><Req />Modalidad</>}>
                  <select className={inputCls} value={art.modality} onChange={(e) => setArt((a) => ({ ...a, modality: e.target.value as any }))}>
                    <option value="">—</option>
                    <option value="Presencial">Presencial</option>
                    <option value="En línea">En línea</option>
                    <option value="Híbrida">Híbrida</option>
                  </select>
                </Field>

                <div className="sm:col-span-2">
                  <Field label={<>Campos internos (no aparecen en la ficha)<HelpTip text="Notas para el equipo. Esto no se imprime." /></>}>
                    <textarea className={textareaCls} rows={3} value={art.internalNotes || ""} onChange={(e) => setArt((a) => ({ ...a, internalNotes: e.target.value }))} placeholder="Notas internas del equipo." />
                  </Field>
                </div>
              </div>
            ) : null}

            {/* ── STEP: LOGÍSTICA (artistic) ── */}
            {kind === "artistic" && step.id === "logistica_art" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={<><Req />Fecha y horarios<HelpTip text="Fecha y horario general de la actividad." /></>}>
                  <DateTimeRangeField value={art.dateAndTime} onChange={(v) => setArt((a) => ({ ...a, dateAndTime: v }))} />
                </Field>
                <Field label={<>Ensayos (fecha y horarios)<HelpTip text="Si aplica, fecha y horario de ensayos." /></>}>
                  <DateTimeRangeField value={art.rehearsalSchedule} onChange={(v) => setArt((a) => ({ ...a, rehearsalSchedule: v }))} />
                </Field>
                <Field label={<>Montaje (fecha y horarios)<HelpTip text="Si aplica, fecha y horario de montaje." /></>}>
                  <DateTimeRangeField value={art.setupSchedule} onChange={(v) => setArt((a) => ({ ...a, setupSchedule: v }))} />
                </Field>
                <Field label={<><Req />Lugar</>}>
                  <input className={inputCls} value={art.place} onChange={(e) => setArt((a) => ({ ...a, place: e.target.value }))} placeholder="Ej. Foro principal / Sala de exposiciones" />
                </Field>
                <Field label={<>Particularidades<HelpTip text="Cosas a considerar: accesibilidad, restricciones, montaje especial, etc." /></>}>
                  <input className={inputCls} value={art.particularities} onChange={(e) => setArt((a) => ({ ...a, particularities: e.target.value }))} placeholder="Ej. Se requiere oscuridad total para la instalación / N/A" />
                </Field>

                <div className="sm:col-span-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-black/5">
                    <div className="text-sm font-semibold text-slate-900">Requerimientos técnicos</div>
                    <div className="mt-1 text-xs text-slate-600">Lo que necesitas para que la actividad suceda (si no aplica, pon N/A).</div>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Internet">
                        <input className={inputCls} value={art.tech.internet} onChange={(e) => setArt((a) => ({ ...a, tech: { ...a.tech, internet: e.target.value } }))} placeholder="Ej. 50 Mbps / N/A" />
                      </Field>
                      <Field label="Montaje">
                        <input className={inputCls} value={art.tech.setup} onChange={(e) => setArt((a) => ({ ...a, tech: { ...a.tech, setup: e.target.value } }))} placeholder="Ej. Estructura metálica 4x4 / N/A" />
                      </Field>
                      <Field label="Ensayos">
                        <input className={inputCls} value={art.tech.rehearsal} onChange={(e) => setArt((a) => ({ ...a, tech: { ...a.tech, rehearsal: e.target.value } }))} placeholder="Ej. Piano de cola disponible / N/A" />
                      </Field>
                      <Field label="Transmisión">
                        <input className={inputCls} value={art.tech.broadcast} onChange={(e) => setArt((a) => ({ ...a, tech: { ...a.tech, broadcast: e.target.value } }))} placeholder="Ej. Streaming YouTube / N/A" />
                      </Field>
                      <Field label="Proyección/Audio">
                        <input className={inputCls} value={art.tech.projectionAudio} onChange={(e) => setArt((a) => ({ ...a, tech: { ...a.tech, projectionAudio: e.target.value } }))} placeholder="Ej. Proyector + sistema de sonido estéreo / N/A" />
                      </Field>
                      <Field label="Otros">
                        <input className={inputCls} value={art.tech.other} onChange={(e) => setArt((a) => ({ ...a, tech: { ...a.tech, other: e.target.value } }))} placeholder="Ej. Vestuario / utilería especial / N/A" />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ── STEP: DIFUSIÓN (artistic) ── */}
            {kind === "artistic" && step.id === "difusion_art" ? (
              <div className="grid grid-cols-1 gap-4">
                <Field label={<>Líneas fuerza<HelpTip text="Frases/ideas clave para la promoción." /></>}>
                  <textarea
                    className={textareaCls}
                    rows={3}
                    value={art.promoLines}
                    onChange={(e) => setArt((a) => ({ ...a, promoLines: e.target.value }))}
                    placeholder="Ej. Una experiencia escénica que cruza tecnología y cuerpo. Función única. Entrada libre."
                  />
                </Field>
                <Field label={<>Recursos para atención al público<HelpTip text="Info útil para responder dudas: requisitos, qué traer, a quién va dirigido, etc." /></>}>
                  <textarea
                    className={textareaCls}
                    rows={3}
                    value={art.audienceResources}
                    onChange={(e) => setArt((a) => ({ ...a, audienceResources: e.target.value }))}
                    placeholder="Ej. Abierto a todo público. Sin costo. Duración aproximada: 60 min."
                  />
                </Field>
                <Field label={<>Palabras clave<HelpTip text="Separadas por coma." /></>}>
                  <input
                    className={inputCls}
                    value={art.keywords}
                    onChange={(e) => setArt((a) => ({ ...a, keywords: e.target.value }))}
                    placeholder="Ej. performance, música, instalación, arte digital"
                  />
                </Field>

                <Field label={<><Req />Semblanza</>}>
                  <textarea
                    className={textareaCls}
                    rows={3}
                    value={art.bio}
                    onChange={(e) => setArt((a) => ({ ...a, bio: e.target.value }))}
                    placeholder="Breve bio de los participantes o compañía: trayectoria, proyectos relevantes."
                  />
                </Field>
              </div>
            ) : null}

            {/* ── STEP: PREVIEW ── */}
            {step.id === "preview" ? (
              <div>
                {missingByStep.length === 0 ? (
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
                    <b>✓ Ficha completa.</b> Lista para enviar a validación cuando termines de revisar.
                  </div>
                ) : (
                  <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
                    <b>Campos pendientes por paso:</b>
                    <div className="mt-3 space-y-3">
                      {missingByStep.map((group) => (
                        <div key={group.stepId} className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{group.stepLabel}</div>
                            <ul className="mt-1 list-disc pl-5 text-xs">
                              {group.fields.map((f) => (
                                <li key={f}>{f}</li>
                              ))}
                            </ul>
                          </div>
                          <button
                            type="button"
                            onClick={() => goToStep(group.stepId)}
                            className="shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-200"
                          >
                            Ir al paso
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                    Guardar borrador
                  </button>
                  <div className="mt-2 text-xs text-slate-500">
                    Se guardará como <b>borrador</b> en tu dispositivo. Desde la vista de ficha podrás <b>editar</b> o <b>enviar a validación</b>.
                  </div>
                </div>
              </div>
            ) : null}
          </StepCard>

          {/* Navigation buttons */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50 disabled:opacity-50"
              onClick={prev}
              disabled={stepIndex === 0}
            >
              Anterior
            </button>

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
      </div>
    </div>
  );
}

/** Red asterisk for required fields */
function Req() {
  return <span className="mr-0.5 text-rose-500">*</span>;
}

/** Section divider with title + description */
function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-slate-100 pb-2">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {description ? <div className="mt-0.5 text-xs text-slate-500">{description}</div> : null}
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
