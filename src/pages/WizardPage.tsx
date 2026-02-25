import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DotNav, type DotStatus } from "../components/DotNav";
import { loadAuth } from "../lib/auth";
import { createDoc } from "../lib/db";
import type { ActivityDoc, ActivityType, ArtisticActivity, CourseActivity } from "../lib/types";
import { defaultArtisticActivity, defaultCourseActivity } from "../lib/defaultProgram";
import { normalizeLiteSessions } from "../lib/courseSessions";

export function WizardPage() {
  const nav = useNavigate();
  const auth = loadAuth();

  const [kind, setKind] = useState<ActivityType>("course");
  const [title, setTitle] = useState("");

  const [course, setCourse] = useState<CourseActivity>(() => ({ ...defaultCourseActivity }));
  const [art, setArt] = useState<ArtisticActivity>(() => ({ ...defaultArtisticActivity }));

  // Dot-nav wizard
  function isBlank(x: string | undefined | null) {
    return !x || !String(x).trim();
  }

  function statusFrom(required: boolean[]): DotStatus {
    const ok = required.filter(Boolean).length;
    if (ok === 0) return "empty";
    if (ok === required.length) return "ok";
    return "partial";
  }

  const sections = useMemo(() => {
    if (kind === "artistic") {
      const sTipo = statusFrom([!isBlank(title)]);
      const sGeneral = statusFrom([
        !isBlank(art.participants),
        !isBlank(art.organizingLab),
        !isBlank(art.cycleName),
        !isBlank(art.collaboration),
        !isBlank(art.description),
        !isBlank(art.modality),
      ]);
      const sLog = statusFrom([
        !isBlank(art.dateAndTime),
        !isBlank(art.rehearsalSchedule),
        !isBlank(art.setupSchedule),
        !isBlank(art.place),
      ]);
      const sTech = "empty" as DotStatus;
      const sDif = statusFrom([!isBlank(art.bio)]);

      return [
        { id: "tipo", label: "Tipo", status: sTipo },
        { id: "general", label: "General", status: sGeneral },
        { id: "logistica", label: "Logística", status: sLog },
        { id: "difusion", label: "Difusión", status: sDif },
        { id: "tech", label: "Técnica", status: sTech },
      ];
    }

    const sTipo = statusFrom([!isBlank(title), !isBlank(course.typeLabel)]);
    const sGeneral = statusFrom([
      !isBlank(course.instructor),
      !isBlank(course.organizingLab),
      !isBlank(course.contactEmail),
    ]);
    const sSesiones = statusFrom([!!course.sessionsCount, !!course.hoursPerSession]);
    const sLog = statusFrom([!isBlank(course.dateAndTime), !isBlank(course.place), !isBlank(course.modality)]);
    const sContenido = statusFrom([
      !isBlank(course.objective),
      !isBlank(course.justification),
      !isBlank(course.syllabus),
      !isBlank(course.entryProfile),
      !isBlank(course.attendees),
      !isBlank(course.materials),
    ]);
    const sDif = statusFrom([!isBlank(course.bio), !isBlank(course.registrationConsiderations)]);

    return [
      { id: "tipo", label: "Tipo", status: sTipo },
      { id: "general", label: "General", status: sGeneral },
      { id: "sesiones", label: "Sesiones", status: sSesiones },
      { id: "logistica", label: "Logística", status: sLog },
      { id: "contenido", label: "Contenido", status: sContenido },
      { id: "difusion", label: "Difusión", status: sDif },
      { id: "tech", label: "Técnica", status: "empty" as DotStatus },
    ];
  }, [kind, title, course, art]);

  const [activeSection, setActiveSection] = useState(sections[0].id);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // (Mejora UX) cuando el usuario cambia el tipo, llévalo a la sección de tipo
  useEffect(() => {
    const el = sectionRefs.current.tipo;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [kind]);

  // sincroniza título con el modelo activo
  useEffect(() => {
    if (kind === "course") setCourse((c) => ({ ...c, title }));
    else setArt((a) => ({ ...a, title }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, kind]);

  useMemo(() => {
    if (!auth) nav("/login");
  }, [auth, nav]);

  useEffect(() => {
    // si cambian las secciones (por tipo), asegúrate de que activeSection exista
    if (!sections.some((s) => s.id === activeSection)) {
      setActiveSection(sections[0].id);
    }
  }, [sections, activeSection]);

  useEffect(() => {
    const onScroll = () => {
      // detecta sección visible (simple: la más cercana al top)
      const entries = sections
        .map((s) => {
          const el = sectionRefs.current[s.id];
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { id: s.id, dist: Math.abs(r.top - 120) };
        })
        .filter(Boolean) as { id: string; dist: number }[];

      entries.sort((a, b) => a.dist - b.dist);
      if (entries[0] && entries[0].id !== activeSection) setActiveSection(entries[0].id);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections, activeSection]);

  if (!auth) return null;

  function onCreate() {
    if (!auth) return;
    const trimmedTitle = title.trim();

    let doc: ActivityDoc;
    if (kind === "artistic") {
      doc = {
        kind: "artistic",
        activity: { ...art, title: trimmedTitle },
      };
    } else {
      const sessionsCount = Math.max(1, course.sessionsCount || 1);
      const hoursPerSession = Math.max(1, course.hoursPerSession || 1);
      const sessions = normalizeLiteSessions(course.sessions, sessionsCount, hoursPerSession);
      doc = {
        kind: "course",
        activity: {
          ...course,
          title: trimmedTitle,
          sessionsCount,
          hoursPerSession,
          sessions,
        },
      };
    }

    createDoc(auth.userId, doc);
    nav("/edit");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Crear nueva ficha</h1>
        <Link
          to="/"
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
        >
          Menú
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <DotNav
          items={sections}
          activeId={activeSection}
          onSelect={(id) => {
            setActiveSection(id);
            const el = sectionRefs.current[id];
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />

        <div className="space-y-6">
          <Section id="tipo" setRef={(el) => (sectionRefs.current.tipo = el)} title="Tipo">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Tipo de ficha">
                <select
                  className={inputCls}
                  value={kind}
                  onChange={(e) => setKind(e.target.value as ActivityType)}
                >
                  <option value="course">Taller / Curso</option>
                  <option value="artistic">Actividad artística</option>
                </select>
              </Field>

              <Field label="Título">
                <input
                  className={inputCls}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Taller de Electrónica"
                />
              </Field>
            </div>

            {kind === "course" ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Tipo (curso/taller/seminario)">
                  <select
                    className={inputCls}
                    value={course.typeLabel}
                    onChange={(e) => setCourse((c) => ({ ...c, typeLabel: e.target.value as any }))}
                  >
                    <option value="Taller">Taller</option>
                    <option value="Curso">Curso</option>
                    <option value="Seminario">Seminario</option>
                  </select>
                </Field>
              </div>
            ) : null}
          </Section>

          <Section id="general" setRef={(el) => (sectionRefs.current.general = el)} title="General">
            {kind === "course" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Persona que imparte">
                  <input className={inputCls} value={course.instructor} onChange={(e) => setCourse((c) => ({ ...c, instructor: e.target.value }))} />
                </Field>
                <Field label="Laboratorio que organiza">
                  <input className={inputCls} value={course.organizingLab} onChange={(e) => setCourse((c) => ({ ...c, organizingLab: e.target.value }))} />
                </Field>
                <Field label="Correo de contacto">
                  <input className={inputCls} value={course.contactEmail} onChange={(e) => setCourse((c) => ({ ...c, contactEmail: e.target.value }))} />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Participantes">
                  <input className={inputCls} value={art.participants} onChange={(e) => setArt((a) => ({ ...a, participants: e.target.value }))} />
                </Field>
                <Field label="Laboratorio que organiza">
                  <input className={inputCls} value={art.organizingLab} onChange={(e) => setArt((a) => ({ ...a, organizingLab: e.target.value }))} />
                </Field>
                <Field label="Nombre del ciclo">
                  <input className={inputCls} value={art.cycleName} onChange={(e) => setArt((a) => ({ ...a, cycleName: e.target.value }))} />
                </Field>
                <Field label="Actividad en colaboración">
                  <input className={inputCls} value={art.collaboration} onChange={(e) => setArt((a) => ({ ...a, collaboration: e.target.value }))} />
                </Field>
                <Field label="Descripción">
                  <textarea className={textareaCls} rows={4} value={art.description} onChange={(e) => setArt((a) => ({ ...a, description: e.target.value }))} />
                </Field>
                <Field label="Modalidad">
                  <select className={inputCls} value={art.modality} onChange={(e) => setArt((a) => ({ ...a, modality: e.target.value as any }))}>
                    <option value="">—</option>
                    <option value="Presencial">Presencial</option>
                    <option value="En línea">En línea</option>
                    <option value="Híbrida">Híbrida</option>
                  </select>
                </Field>
              </div>
            )}
          </Section>

          {kind === "course" ? (
            <Section id="sesiones" setRef={(el) => (sectionRefs.current.sesiones = el)} title="Sesiones (obligatorio)">
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
              <div className="mt-3 text-sm text-slate-600">
                En el editor podrás capturar <b>fechas</b> y <b>horarios</b> por sesión y usar “+ Agregar sesión”.
              </div>
            </Section>
          ) : null}

          <Section id="logistica" setRef={(el) => (sectionRefs.current.logistica = el)} title="Logística">
            {kind === "course" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Fecha y horarios (texto general)">
                  <input className={inputCls} value={course.dateAndTime} onChange={(e) => setCourse((c) => ({ ...c, dateAndTime: e.target.value }))} />
                </Field>
                <Field label="Lugar">
                  <input className={inputCls} value={course.place} onChange={(e) => setCourse((c) => ({ ...c, place: e.target.value }))} />
                </Field>
                <Field label="Modalidad">
                  <select className={inputCls} value={course.modality} onChange={(e) => setCourse((c) => ({ ...c, modality: e.target.value as any }))}>
                    <option value="">—</option>
                    <option value="Presencial">Presencial</option>
                    <option value="En línea">En línea</option>
                    <option value="Híbrida">Híbrida</option>
                  </select>
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Fecha y horarios">
                  <input className={inputCls} value={art.dateAndTime} onChange={(e) => setArt((a) => ({ ...a, dateAndTime: e.target.value }))} />
                </Field>
                <Field label="Ensayos (fecha y horarios)">
                  <input className={inputCls} value={art.rehearsalSchedule} onChange={(e) => setArt((a) => ({ ...a, rehearsalSchedule: e.target.value }))} />
                </Field>
                <Field label="Montaje (fecha y horarios)">
                  <input className={inputCls} value={art.setupSchedule} onChange={(e) => setArt((a) => ({ ...a, setupSchedule: e.target.value }))} />
                </Field>
                <Field label="Lugar">
                  <input className={inputCls} value={art.place} onChange={(e) => setArt((a) => ({ ...a, place: e.target.value }))} />
                </Field>
              </div>
            )}
          </Section>

          {kind === "course" ? (
            <Section id="contenido" setRef={(el) => (sectionRefs.current.contenido = el)} title="Contenido">
              <div className="grid grid-cols-1 gap-4">
                <Field label="Objetivo">
                  <textarea className={textareaCls} rows={3} value={course.objective} onChange={(e) => setCourse((c) => ({ ...c, objective: e.target.value }))} />
                </Field>
                <Field label="Justificación">
                  <textarea className={textareaCls} rows={3} value={course.justification} onChange={(e) => setCourse((c) => ({ ...c, justification: e.target.value }))} />
                </Field>
                <Field label="Temario">
                  <textarea className={textareaCls} rows={4} value={course.syllabus} onChange={(e) => setCourse((c) => ({ ...c, syllabus: e.target.value }))} />
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
              </div>
            </Section>
          ) : null}

          <Section id="difusion" setRef={(el) => (sectionRefs.current.difusion = el)} title="Difusión">
            {kind === "course" ? (
              <div className="grid grid-cols-1 gap-4">
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
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <Field label="Semblanza">
                  <textarea className={textareaCls} rows={3} value={art.bio} onChange={(e) => setArt((a) => ({ ...a, bio: e.target.value }))} />
                </Field>
              </div>
            )}
          </Section>

          <Section id="tech" setRef={(el) => (sectionRefs.current.tech = el)} title="Requerimientos técnicos">
            <p className="text-sm text-slate-600">(Opcional en wizard) Internet, montaje, proyección/audio, etc.</p>
          </Section>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <button
              type="button"
              className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              onClick={onCreate}
            >
              Crear y editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
  setRef,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  setRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <section ref={setRef} id={id} className="scroll-mt-24 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2";
const textareaCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2";

