import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DotNav } from "../components/DotNav";
import { loadAuth } from "../lib/auth";
import { createDoc } from "../lib/db";
import type { ActivityDoc, ActivityType } from "../lib/types";
import { defaultArtisticActivity, defaultCourseActivity } from "../lib/defaultProgram";
import { normalizeLiteSessions } from "../lib/courseSessions";

export function WizardPage() {
  const nav = useNavigate();
  const auth = loadAuth();

  const [kind, setKind] = useState<ActivityType>("course");
  const [title, setTitle] = useState("");

  // Taller/Curso
  const [typeLabel, setTypeLabel] = useState<"Curso" | "Taller" | "Seminario" | "">("Taller");
  const [sessionsCount, setSessionsCount] = useState(8);
  const [hoursPerSession, setHoursPerSession] = useState(3);

  // Dot-nav wizard
  const sections = useMemo(() => {
    if (kind === "artistic") {
      return [
        { id: "tipo", label: "Tipo" },
        { id: "general", label: "General" },
        { id: "logistica", label: "Logística" },
        { id: "tech", label: "Técnica" },
      ];
    }
    return [
      { id: "tipo", label: "Tipo" },
      { id: "general", label: "General" },
      { id: "sesiones", label: "Sesiones" },
      { id: "logistica", label: "Logística" },
      { id: "tech", label: "Técnica" },
    ];
  }, [kind]);

  const [activeSection, setActiveSection] = useState(sections[0].id);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // (Mejora UX) cuando el usuario cambia el tipo, llévalo a la sección de tipo
  useEffect(() => {
    const el = sectionRefs.current.tipo;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [kind]);

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
        activity: { ...defaultArtisticActivity, title: trimmedTitle },
      };
    } else {
      const sessions = normalizeLiteSessions([], Math.max(1, sessionsCount), Math.max(1, hoursPerSession));
      doc = {
        kind: "course",
        activity: {
          ...defaultCourseActivity,
          title: trimmedTitle,
          typeLabel,
          sessionsCount: Math.max(1, sessionsCount),
          hoursPerSession: Math.max(1, hoursPerSession),
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
                  <select className={inputCls} value={typeLabel} onChange={(e) => setTypeLabel(e.target.value as any)}>
                    <option value="Taller">Taller</option>
                    <option value="Curso">Curso</option>
                    <option value="Seminario">Seminario</option>
                  </select>
                </Field>
              </div>
            ) : null}
          </Section>

          <Section id="general" setRef={(el) => (sectionRefs.current.general = el)} title="General">
            <p className="text-sm text-slate-600">
              Tip: en el wizard solo capturamos lo esencial. El resto lo completas en el editor.
            </p>
          </Section>

          {kind === "course" ? (
            <Section id="sesiones" setRef={(el) => (sectionRefs.current.sesiones = el)} title="Sesiones (obligatorio)">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Número de sesiones">
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={sessionsCount}
                    onChange={(e) => setSessionsCount(Math.max(1, Number(e.target.value || 1)))}
                  />
                </Field>
                <Field label="Horas por sesión">
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={hoursPerSession}
                    onChange={(e) => setHoursPerSession(Math.max(1, Number(e.target.value || 1)))}
                  />
                </Field>
              </div>
              <div className="mt-3 text-sm text-slate-600">
                Luego podrás capturar <b>fechas</b> y <b>horarios</b> por sesión y usar “+ Agregar sesión” si hace falta.
              </div>
            </Section>
          ) : null}

          <Section id="logistica" setRef={(el) => (sectionRefs.current.logistica = el)} title="Logística">
            <p className="text-sm text-slate-600">Lugar, modalidad, fechas generales (si aplica).</p>
          </Section>

          <Section id="tech" setRef={(el) => (sectionRefs.current.tech = el)} title="Requerimientos técnicos">
            <p className="text-sm text-slate-600">Internet, montaje, proyección/audio, etc.</p>
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

