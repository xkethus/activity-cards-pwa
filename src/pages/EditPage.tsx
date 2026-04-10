import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DatePickerField } from "../components/DatePickerField";
import { validateForSubmission } from "../lib/validation";
import { HelpTip } from "../components/Tooltip";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type {
  ActivityDoc,
  ArtisticActivity,
  CourseActivity,
  Program,
  Session,
  SessionAgendaItem,
} from "../lib/types";
import { exportDocJson, importDocJson } from "../lib/storage";
import {
  getActiveDocId,
  getDocById,
  getOrCreateFirstDoc,
  loadDocs,
  setActiveDocId,
  upsertDoc,
  type ActivityRecord,
} from "../lib/db";
import { loadAuth } from "../lib/auth";
import {
  defaultArtisticActivity,
  defaultCourseActivity,
  defaultSessionsProgram,
} from "../lib/defaultProgram";
import { normalizeLiteSessions } from "../lib/courseSessions";
import { downloadMarkdown } from "../exports/toMarkdown";

export function EditPage() {
  const nav = useNavigate();
  const auth = loadAuth();

  const initialRec = useMemo((): ActivityRecord | null => {
    if (!auth) return null;
    const docs = loadDocs();
    if (docs.length === 0) return getOrCreateFirstDoc(auth.userId);
    const active = getActiveDocId();
    const byId = active ? getDocById(active) : null;
    const picked = byId ?? docs[0];
    if (picked && picked.id !== active) setActiveDocId(picked.id);
    return picked;
  }, [auth]);

  const [rec, setRec] = useState<ActivityRecord | null>(initialRec);
  const [doc, setDoc] = useState<ActivityDoc>(initialRec?.doc ?? { kind: "sessions", program: defaultSessionsProgram });
  const [status, setStatus] = useState<string>("");
  const [confirmReset, setConfirmReset] = useState(false);

  const canEdit = useMemo(() => {
    if (!auth || !rec) return false;
    if (auth.role === "ADMIN") return true;
    if (auth.role === "DIRECTOR") return true;
    if (auth.role === "CREATOR") return rec.ownerId === auth.userId;
    return false;
  }, [auth, rec]);

  useEffect(() => {
    if (!auth) {
      nav("/login");
      return;
    }
  }, [auth, nav]);

  useEffect(() => {
    if (auth && rec && !canEdit) {
      nav("/view", { replace: true });
    }
  }, [auth, rec, canEdit, nav]);

  useEffect(() => {
    if (!rec) return;
    const next: ActivityRecord = { ...rec, doc, updatedAt: Date.now() };
    setRec(next);
    upsertDoc(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  async function onImport(file: File) {
    try {
      const d = await importDocJson(file);
      setDoc(d);
      setStatus("Importado OK");
      setTimeout(() => setStatus(""), 1500);
    } catch {
      setStatus("Error: JSON inválido");
      setTimeout(() => setStatus(""), 2000);
    }
  }

  function setKind(kind: "artistic" | "course") {
    setDoc((prev) => {
      if (prev.kind === kind) return prev;
      if (kind === "artistic") return { kind, activity: defaultArtisticActivity };
      return { kind, activity: defaultCourseActivity };
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {confirmReset ? (
        <ConfirmDialog
          title="Restablecer ficha"
          message="Se borrarán todos los cambios y la ficha volverá a los valores por defecto. Esta acción no se puede deshacer."
          confirmLabel="Sí, restablecer"
          danger
          onConfirm={() => {
            setDoc((prev) => {
              if (prev.kind === "sessions") return { kind: "sessions", program: defaultSessionsProgram };
              if (prev.kind === "artistic") return { kind: "artistic", activity: defaultArtisticActivity };
              return { kind: "course", activity: defaultCourseActivity };
            });
            setRec((prev) => {
              if (!prev) return prev;
              const next: ActivityRecord = { ...prev, status: "BORRADOR", updatedAt: Date.now() };
              upsertDoc(next);
              return next;
            });
            setConfirmReset(false);
          }}
          onCancel={() => setConfirmReset(false)}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Editar</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
            to="/docs"
          >
            Fichas
          </Link>
          <Link
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
            to="/view"
          >
            Ver
          </Link>
          <Link
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            to="/print"
          >
            Exportar PDF
          </Link>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-600">
        Guardado automático en este navegador (localStorage). Usa Exportar/Importar para compartir.
      </div>

      {rec ? (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              Estado: <b>{formatStatus(rec.status)}</b>
            </div>
            <div className="flex flex-wrap gap-2">
              {rec.status === "BORRADOR" ? (
                <button
                  type="button"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  onClick={() => {
                    const missing = validateForSubmission(doc);
                    if (missing.length) {
                      setStatus(`Faltan campos obligatorios: ${missing.join(", ")}.`);
                      setTimeout(() => setStatus(""), 3500);
                      return;
                    }

                    setRec((prev) => {
                      if (!prev) return prev;
                      const next: ActivityRecord = { ...prev, status: "ENVIADA", updatedAt: Date.now() };
                      upsertDoc(next);
                      return next;
                    });
                    setStatus("Enviada a validación");
                    setTimeout(() => setStatus(""), 1500);
                  }}
                >
                  Enviar a validación
                </button>
              ) : null}

              {rec.status === "ENVIADA" ? (
                <button
                  type="button"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
                  onClick={() => {
                    setRec((prev) => {
                      if (!prev) return prev;
                      const next: ActivityRecord = { ...prev, status: "BORRADOR", updatedAt: Date.now() };
                      upsertDoc(next);
                      return next;
                    });
                    setStatus("Regresó a borrador");
                    setTimeout(() => setStatus(""), 1500);
                  }}
                >
                  Regresar a borrador
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {status ? (
        <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {status}
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-6">
        <Card title="Tipo de ficha">
          <Field label="Tipo">
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              value={doc.kind}
              onChange={(e) => setKind(e.target.value as any)}
            >
              <option value="course">Taller / Curso</option>
              <option value="artistic">Actividad artística</option>
            </select>
          </Field>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
              onClick={() => exportDocJson(doc)}
              type="button"
            >
              Exportar JSON
            </button>

            <label className="cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50">
              Importar JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onImport(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>

            <button
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
              onClick={() => downloadMarkdown(doc)}
              type="button"
            >
              Descargar Markdown
            </button>

            <button
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              onClick={() => setConfirmReset(true)}
              type="button"
            >
              Reset
            </button>
          </div>
        </Card>

        {doc.kind === "sessions" ? (
          <SessionsEditor doc={doc} onChange={setDoc} />
        ) : doc.kind === "artistic" ? (
          <ArtisticEditor activity={doc.activity} onChange={(a) => setDoc({ kind: "artistic", activity: a })} />
        ) : (
          <CourseEditor activity={doc.activity} onChange={(a) => setDoc({ kind: "course", activity: a })} />
        )}

        <Card title="DOC / Word (viable)">
          <p className="text-sm text-slate-600">
            Viable: exportar a <b>texto/Markdown</b> (ya) y a <b>.docx</b> con una librería (pendiente).
            Para importar desde Word, lo más fiable es convertir a texto estructurado (headings/listas) y hacer un mapeo.
          </p>
        </Card>
      </div>
    </div>
  );
}

function SessionsEditor({
  doc,
  onChange,
}: {
  doc: { kind: "sessions"; program: Program };
  onChange: (d: ActivityDoc) => void;
}) {
  const program = doc.program;

  function setProgram(patch: Partial<Program>) {
    onChange({ kind: "sessions", program: { ...program, ...patch } });
  }

  function updateSession(index: number, patch: Partial<Session>) {
    setProgram({
      sessions: program.sessions.map((s) => (s.index === index ? { ...s, ...patch } : s)),
    });
  }

  function ensureSessionCount(n: number) {
    const sessions = program.sessions.slice().sort((a, b) => a.index - b.index);
    const existing = new Map(sessions.map((s) => [s.index, s] as const));
    const next: Session[] = [];
    for (let i = 1; i <= n; i++) {
      const s = existing.get(i);
      next.push(
        s ?? {
          index: i,
          title: `Sesión ${i}`,
          dateText: "",
          timeText: "",
          learningObjectives: [""],
          agenda: [{ time: "", title: "", durationMin: 0, notes: "" }],
          materials: [""],
        }
      );
    }
    const hoursPerSession = program.metrics.hoursPerSession;
    setProgram({
      metrics: { ...program.metrics, sessions: n, totalHours: n * hoursPerSession },
      sessions: next,
    });
  }

  return (
    <>
      <Card title="Programa">
        <Field label="Título">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            value={program.title}
            onChange={(e) => setProgram({ title: e.target.value })}
          />
        </Field>
        <Field label="Subtítulo (opcional)">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            value={program.subtitle ?? ""}
            onChange={(e) => setProgram({ subtitle: e.target.value || undefined })}
          />
        </Field>
        <Field label="Descripción">
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            rows={4}
            value={program.description}
            onChange={(e) => setProgram({ description: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Sesiones">
            <input
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              value={program.metrics.sessions}
              min={1}
              onChange={(e) => ensureSessionCount(Math.max(1, Number(e.target.value || 1)))}
            />
          </Field>
          <Field label="Horas por sesión">
            <input
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              value={program.metrics.hoursPerSession}
              min={1}
              onChange={(e) => {
                const h = Math.max(1, Number(e.target.value || 1));
                setProgram({
                  metrics: { ...program.metrics, hoursPerSession: h, totalHours: h * program.metrics.sessions },
                });
              }}
            />
          </Field>
          <Field label="Total horas">
            <input
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
              value={program.metrics.totalHours}
              readOnly
            />
          </Field>
        </div>
      </Card>

      <Card title="Sesiones">
        <div className="space-y-8">
          {program.sessions
            .slice()
            .sort((a, b) => a.index - b.index)
            .map((s) => (
              <SessionEditor
                key={s.index}
                total={program.metrics.sessions}
                session={s}
                onChange={(patch) => updateSession(s.index, patch)}
              />
            ))}
        </div>
      </Card>
    </>
  );
}

function ArtisticEditor({
  activity,
  onChange,
}: {
  activity: ArtisticActivity;
  onChange: (a: ArtisticActivity) => void;
}) {
  return (
    <Card title="Actividad artística">
      <Field label="Título">
        <input className={inputCls} value={activity.title} onChange={(e) => onChange({ ...activity, title: e.target.value })} />
      </Field>
      <Field label="Participantes">
        <input className={inputCls} value={activity.participants} onChange={(e) => onChange({ ...activity, participants: e.target.value })} />
      </Field>
      <Field label="Laboratorio que organiza">
        <input className={inputCls} value={activity.organizingLab} onChange={(e) => onChange({ ...activity, organizingLab: e.target.value })} />
      </Field>
      <Field label="Nombre del ciclo">
        <input className={inputCls} value={activity.cycleName} onChange={(e) => onChange({ ...activity, cycleName: e.target.value })} />
      </Field>
      <Field label="Actividad en colaboración">
        <input className={inputCls} value={activity.collaboration} onChange={(e) => onChange({ ...activity, collaboration: e.target.value })} />
      </Field>
      <Field label="Descripción">
        <textarea className={textareaCls} rows={4} value={activity.description} onChange={(e) => onChange({ ...activity, description: e.target.value })} />
      </Field>
      <Field label="Tipo de actividad (modalidad)">
        <select className={inputCls} value={activity.modality} onChange={(e) => onChange({ ...activity, modality: e.target.value as any })}>
          <option value="">—</option>
          <option value="Presencial">Presencial</option>
          <option value="En línea">En línea</option>
          <option value="Híbrida">Híbrida</option>
        </select>
      </Field>
      <Field label="Fecha y horarios">
        <input className={inputCls} value={activity.dateAndTime} onChange={(e) => onChange({ ...activity, dateAndTime: e.target.value })} />
      </Field>
      <Field label="Ensayos (fecha y horarios)">
        <input className={inputCls} value={activity.rehearsalSchedule} onChange={(e) => onChange({ ...activity, rehearsalSchedule: e.target.value })} />
      </Field>
      <Field label="Montaje (fecha y horarios)">
        <input className={inputCls} value={activity.setupSchedule} onChange={(e) => onChange({ ...activity, setupSchedule: e.target.value })} />
      </Field>
      <Field label="Lugar">
        <input className={inputCls} value={activity.place} onChange={(e) => onChange({ ...activity, place: e.target.value })} />
      </Field>
      <Field label="Particularidades">
        <textarea className={textareaCls} rows={3} value={activity.particularities} onChange={(e) => onChange({ ...activity, particularities: e.target.value })} />
      </Field>
      <Field label="Consideraciones extra (registro)">
        <textarea className={textareaCls} rows={3} value={activity.registrationConsiderations} onChange={(e) => onChange({ ...activity, registrationConsiderations: e.target.value })} />
      </Field>
      <Field label="Semblanza">
        <textarea className={textareaCls} rows={3} value={activity.bio} onChange={(e) => onChange({ ...activity, bio: e.target.value })} />
      </Field>
      <Field label="Líneas fuerza">
        <textarea className={textareaCls} rows={3} value={activity.promoLines} onChange={(e) => onChange({ ...activity, promoLines: e.target.value })} />
      </Field>
      <Field label="Recursos para atención al público">
        <textarea className={textareaCls} rows={3} value={activity.audienceResources} onChange={(e) => onChange({ ...activity, audienceResources: e.target.value })} />
      </Field>
      <Field label="Palabras clave">
        <input className={inputCls} value={activity.keywords} onChange={(e) => onChange({ ...activity, keywords: e.target.value })} />
      </Field>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-black/5">
        <div className="text-sm font-semibold text-slate-900">Requerimientos técnicos</div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([
            ["Internet", "internet"],
            ["Montaje", "setup"],
            ["Ensayos", "rehearsal"],
            ["Transmisión", "broadcast"],
            ["Proyección / Audio", "projectionAudio"],
            ["Otros", "other"],
          ] as const).map(([label, key]) => (
            <Field key={key} label={label}>
              <input
                className={inputCls}
                value={(activity.tech as any)[key]}
                onChange={(e) => onChange({ ...activity, tech: { ...activity.tech, [key]: e.target.value } })}
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Field label="Notas internas (no aparecen en la ficha)">
          <textarea className={textareaCls} rows={4} value={activity.internalNotes ?? ""} onChange={(e) => onChange({ ...activity, internalNotes: e.target.value })} />
        </Field>
      </div>
    </Card>
  );
}

function CourseEditor({
  activity,
  onChange,
}: {
  activity: CourseActivity;
  onChange: (a: CourseActivity) => void;
}) {
  return (
    <Card title="Curso / Taller / Seminario">
      <Field label="Título">
        <input className={inputCls} value={activity.title} onChange={(e) => onChange({ ...activity, title: e.target.value })} />
      </Field>
      <Field label="Tipo (curso/taller/seminario)">
        <select className={inputCls} value={activity.typeLabel} onChange={(e) => onChange({ ...activity, typeLabel: e.target.value as any })}>
          <option value="">—</option>
          <option value="Curso">Curso</option>
          <option value="Taller">Taller</option>
          <option value="Seminario">Seminario</option>
        </select>
      </Field>
      <Field label="Persona que imparte">
        <input className={inputCls} value={activity.instructor} onChange={(e) => onChange({ ...activity, instructor: e.target.value })} />
      </Field>
      <Field label="Laboratorio que organiza">
        <input className={inputCls} value={activity.organizingLab} onChange={(e) => onChange({ ...activity, organizingLab: e.target.value })} />
      </Field>
      <Field label="Correo de contacto">
        <input className={inputCls} value={activity.contactEmail} onChange={(e) => onChange({ ...activity, contactEmail: e.target.value })} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Número de sesiones (obligatorio)">
          <input
            type="number"
            className={inputCls}
            value={activity.sessionsCount}
            min={1}
            onChange={(e) => {
              const n = Math.max(1, Number(e.target.value || 1));
              onChange({
                ...activity,
                sessionsCount: n,
                sessions: normalizeLiteSessions(activity.sessions, n, activity.hoursPerSession),
              });
            }}
          />
        </Field>
        <Field label="Horas por sesión">
          <input
            type="number"
            className={inputCls}
            value={activity.hoursPerSession}
            min={1}
            onChange={(e) => {
              const h = Math.max(1, Number(e.target.value || 1));
              onChange({
                ...activity,
                hoursPerSession: h,
                sessions: activity.sessions.map((s) => ({ ...s, durationHours: s.durationHours || h })),
              });
            }}
          />
        </Field>
        <Field label="Modalidad">
          <select className={inputCls} value={activity.modality} onChange={(e) => onChange({ ...activity, modality: e.target.value as any })}>
            <option value="">—</option>
            <option value="Presencial">Presencial</option>
            <option value="En línea">En línea</option>
            <option value="Híbrida">Híbrida</option>
          </select>
        </Field>
      </div>

      <div className="mt-6">
        <LiteSessionsEditor
          sessions={activity.sessions}
          hoursPerSession={activity.hoursPerSession}
          onChange={(sessions) => onChange({ ...activity, sessions })}
          onAdd={() => {
            const nextIndex = (activity.sessions.at(-1)?.index ?? activity.sessions.length) + 1;
            const next = [
              ...activity.sessions,
              {
                index: nextIndex,
                title: "",
                dateISO: "",
                startTime: "",
                endTime: "",
                durationHours: activity.hoursPerSession,
              },
            ];
            onChange({ ...activity, sessionsCount: next.length, sessions: next });
          }}
        />
      </div>
      <Field label="Fecha y horarios">
        <input className={inputCls} value={activity.dateAndTime} onChange={(e) => onChange({ ...activity, dateAndTime: e.target.value })} />
      </Field>
      <Field label="Lugar">
        <input className={inputCls} value={activity.place} onChange={(e) => onChange({ ...activity, place: e.target.value })} />
      </Field>
      <Field label="Actividad seriada (ciclo/marco)">
        <input className={inputCls} value={activity.seriesInfo} onChange={(e) => onChange({ ...activity, seriesInfo: e.target.value })} />
      </Field>
      <Field label="Colaboración">
        <input className={inputCls} value={activity.collaboration} onChange={(e) => onChange({ ...activity, collaboration: e.target.value })} />
      </Field>

      <Field label="Objetivo">
        <textarea className={textareaCls} rows={3} value={activity.objective} onChange={(e) => onChange({ ...activity, objective: e.target.value })} />
      </Field>
      <Field label={<>Justificación<HelpTip text="Explica por qué esta actividad es necesaria: pertinencia, problema que atiende, contexto y público." /></>}>
        <textarea className={textareaCls} rows={3} value={activity.justification} onChange={(e) => onChange({ ...activity, justification: e.target.value })} />
      </Field>
      <Field label={<>Temario<HelpTip text="Lista de temas a cubrir (puede ser por módulos o por bloques)." /></>}>
        <textarea className={textareaCls} rows={4} value={activity.syllabus} onChange={(e) => onChange({ ...activity, syllabus: e.target.value })} />
      </Field>
      <Field label={<>Metodología<HelpTip text="Describe cómo se trabajará: dinámicas, estructura, ejercicios, recursos y modalidad." /></>}>
        <textarea className={textareaCls} rows={3} value={activity.methodology} onChange={(e) => onChange({ ...activity, methodology: e.target.value })} />
      </Field>
      <Field label="Perfil de ingreso">
        <textarea className={textareaCls} rows={3} value={activity.entryProfile} onChange={(e) => onChange({ ...activity, entryProfile: e.target.value })} />
      </Field>
      <Field label="Número de asistentes">
        <textarea className={textareaCls} rows={2} value={activity.attendees} onChange={(e) => onChange({ ...activity, attendees: e.target.value })} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Materiales solicitados">
          <textarea className={textareaCls} rows={2} value={activity.materials} onChange={(e) => onChange({ ...activity, materials: e.target.value })} />
        </Field>
        <Field label="Cuota de recuperación">
          <textarea className={textareaCls} rows={2} value={activity.materialFee} onChange={(e) => onChange({ ...activity, materialFee: e.target.value })} />
        </Field>
      </div>

      <Field label="Semblanza">
        <textarea className={textareaCls} rows={3} value={activity.bio} onChange={(e) => onChange({ ...activity, bio: e.target.value })} />
      </Field>
      <Field label="Consideraciones extra (registro)">
        <textarea className={textareaCls} rows={3} value={activity.registrationConsiderations} onChange={(e) => onChange({ ...activity, registrationConsiderations: e.target.value })} />
      </Field>
      <Field label="Líneas fuerza">
        <textarea className={textareaCls} rows={3} value={activity.promoLines} onChange={(e) => onChange({ ...activity, promoLines: e.target.value })} />
      </Field>
      <Field label="Recursos para atención al público">
        <textarea className={textareaCls} rows={3} value={activity.audienceResources} onChange={(e) => onChange({ ...activity, audienceResources: e.target.value })} />
      </Field>
      <Field label="Palabras clave">
        <input className={inputCls} value={activity.keywords} onChange={(e) => onChange({ ...activity, keywords: e.target.value })} />
      </Field>

      <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-black/5">
        <div className="text-sm font-semibold text-slate-900">Requerimientos técnicos</div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([
            ["Internet", "internet"],
            ["Montaje", "setup"],
            ["Transmisión", "broadcast"],
            ["Proyección / Audio", "projectionAudio"],
            ["Otros", "other"],
          ] as const).map(([label, key]) => (
            <Field key={key} label={label}>
              <input
                className={inputCls}
                value={(activity.tech as any)[key]}
                onChange={(e) => onChange({ ...activity, tech: { ...activity.tech, [key]: e.target.value } })}
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Field label="Notas internas (no aparecen en la ficha)">
          <textarea className={textareaCls} rows={4} value={activity.internalNotes ?? ""} onChange={(e) => onChange({ ...activity, internalNotes: e.target.value })} />
        </Field>
      </div>
    </Card>
  );
}

function SessionEditor({
  total,
  session,
  onChange,
}: {
  total: number;
  session: Session;
  onChange: (patch: Partial<Session>) => void;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-black/5">
      <div className="text-sm font-semibold text-slate-900">
        Sesión {session.index} de {total}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Título">
          <input className={inputCls} value={session.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <Field label="Fecha (texto)">
          <input className={inputCls} value={session.dateText} onChange={(e) => onChange({ dateText: e.target.value })} />
        </Field>
        <Field label="Horario (texto)">
          <input className={inputCls} value={session.timeText} onChange={(e) => onChange({ timeText: e.target.value })} />
        </Field>
      </div>

      <div className="mt-6">
        <ListEditor title="Objetivos" items={session.learningObjectives} onChange={(items) => onChange({ learningObjectives: items })} />
      </div>

      <div className="mt-6">
        <AgendaEditor agenda={session.agenda} onChange={(agenda) => onChange({ agenda })} />
      </div>

      <div className="mt-6">
        <ListEditor title="Materiales" items={session.materials} onChange={(items) => onChange({ materials: items })} />
      </div>
    </div>
  );
}

function ListEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-3 space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              className={inputCls}
              value={it}
              onChange={(e) => onChange(items.map((x, i) => (i === idx ? e.target.value : x)))}
            />
            <button
              type="button"
              className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
            >
              −
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
        onClick={() => onChange([...items, ""]) }
      >
        + Agregar
      </button>
    </div>
  );
}

function AgendaEditor({
  agenda,
  onChange,
}: {
  agenda: SessionAgendaItem[];
  onChange: (agenda: SessionAgendaItem[]) => void;
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-900">Agenda</div>
      <div className="mt-3 space-y-3">
        {agenda.map((a, idx) => (
          <div key={idx} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Hora">
                <input
                  className={inputCls}
                  value={a.time}
                  onChange={(e) => onChange(agenda.map((x, i) => (i === idx ? { ...x, time: e.target.value } : x)))}
                />
              </Field>
              <Field label="Título">
                <input
                  className={inputCls}
                  value={a.title}
                  onChange={(e) => onChange(agenda.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))}
                />
              </Field>
              <Field label="Duración (min)">
                <input
                  type="number"
                  className={inputCls}
                  value={a.durationMin}
                  onChange={(e) =>
                    onChange(
                      agenda.map((x, i) => (i === idx ? { ...x, durationMin: Number(e.target.value || 0) } : x))
                    )
                  }
                />
              </Field>
            </div>
            <Field label="Notas (opcional)">
              <input
                className={inputCls}
                value={a.notes ?? ""}
                onChange={(e) => onChange(agenda.map((x, i) => (i === idx ? { ...x, notes: e.target.value } : x)))}
              />
            </Field>
            <div className="mt-2">
              <button
                type="button"
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
                onClick={() => onChange(agenda.filter((_, i) => i !== idx))}
              >
                Quitar bloque
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
        onClick={() => onChange([...agenda, { time: "", title: "", durationMin: 0, notes: "" }])}
      >
        + Agregar bloque
      </button>
    </div>
  );
}

function formatStatus(s: string) {
  switch (s) {
    case "BORRADOR":
      return "Borrador";
    case "ENVIADA":
      return "Enviada";
    case "APROBADA":
      return "Aprobada";
    case "RECHAZADA":
      return "Rechazada";
    default:
      return s;
  }
}

// validateForSubmission moved to src/lib/validation.ts

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
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

function LiteSessionsEditor({
  sessions,
  hoursPerSession,
  onChange,
  onAdd,
}: {
  sessions: { index: number; title?: string; dateISO: string; startTime: string; endTime: string; durationHours: number }[];
  hoursPerSession: number;
  onChange: (sessions: { index: number; title?: string; dateISO: string; startTime: string; endTime: string; durationHours: number }[]) => void;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-black/5">
      <div className="text-sm font-semibold text-slate-900">Sesiones (fechas y horarios)</div>
      <div className="mt-3 space-y-3">
        {sessions
          .slice()
          .sort((a, b) => a.index - b.index)
          .map((s) => (
            <div key={s.index} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <div className="text-xs font-semibold text-slate-700">Sesión {s.index}</div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
                <Field label="Título (opcional)">
                  <input
                    className={inputCls}
                    value={s.title ?? ""}
                    onChange={(e) =>
                      onChange(sessions.map((x) => (x.index === s.index ? { ...x, title: e.target.value } : x)))
                    }
                  />
                </Field>
                <Field label="Fecha">
                  <DatePickerField
                    valueISO={s.dateISO}
                    onChangeISO={(iso) =>
                      onChange(sessions.map((x) => (x.index === s.index ? { ...x, dateISO: iso } : x)))
                    }
                  />
                </Field>
                <Field label="Inicio">
                  <input
                    type="time"
                    className={inputCls}
                    value={s.startTime}
                    onChange={(e) =>
                      onChange(sessions.map((x) => (x.index === s.index ? { ...x, startTime: e.target.value } : x)))
                    }
                  />
                </Field>
                <Field label="Fin">
                  <input
                    type="time"
                    className={inputCls}
                    value={s.endTime}
                    onChange={(e) =>
                      onChange(sessions.map((x) => (x.index === s.index ? { ...x, endTime: e.target.value } : x)))
                    }
                  />
                </Field>
                <Field label="Duración (h)">
                  <input
                    type="number"
                    className={inputCls}
                    value={s.durationHours || hoursPerSession}
                    min={1}
                    onChange={(e) =>
                      onChange(
                        sessions.map((x) =>
                          x.index === s.index ? { ...x, durationHours: Math.max(1, Number(e.target.value || 1)) } : x
                        )
                      )
                    }
                  />
                </Field>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
                  onClick={() => {
                    const next = sessions.filter((x) => x.index !== s.index).map((x, i) => ({ ...x, index: i + 1 }));
                    onChange(next);
                  }}
                  disabled={sessions.length <= 1}
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
      </div>
      <button
        type="button"
        className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
        onClick={onAdd}
      >
        + Agregar sesión
      </button>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2";
const textareaCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2";
