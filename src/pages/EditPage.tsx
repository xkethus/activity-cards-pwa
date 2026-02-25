import { useEffect, useMemo, useState } from "react";
import type { Program, Session, SessionAgendaItem } from "../lib/types";
import {
  exportProgramJson,
  importProgramJson,
  loadProgram,
  resetProgram,
  saveProgram,
} from "../lib/storage";
import { downloadMarkdown } from "../exports/toMarkdown";

export function EditPage() {
  const initial = useMemo(() => loadProgram(), []);
  const [program, setProgram] = useState<Program>(initial);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    saveProgram(program);
  }, [program]);

  function updateSession(index: number, patch: Partial<Session>) {
    setProgram((p) => ({
      ...p,
      sessions: p.sessions.map((s) => (s.index === index ? { ...s, ...patch } : s)),
    }));
  }

  function ensureSessionCount(n: number) {
    setProgram((p) => {
      const sessions = p.sessions.slice().sort((a, b) => a.index - b.index);
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
      const hoursPerSession = p.metrics.hoursPerSession;
      return {
        ...p,
        metrics: { ...p.metrics, sessions: n, totalHours: n * hoursPerSession },
        sessions: next,
      };
    });
  }

  async function onImport(file: File) {
    try {
      const p = await importProgramJson(file);
      setProgram(p);
      setStatus("Importado OK");
      setTimeout(() => setStatus(""), 1500);
    } catch {
      setStatus("Error: JSON inválido");
      setTimeout(() => setStatus(""), 2000);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Editar programa</h1>
        <div className="flex flex-wrap gap-2">
          <a
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
            href="/#/"
          >
            Ver
          </a>
          <a
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            href="/#/print"
          >
            Exportar PDF
          </a>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-600">
        Guardado automático en este navegador (localStorage). Usa Exportar/Importar para compartir.
      </div>

      {status ? (
        <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          {status}
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-6">
        <Card title="Programa">
          <Field label="Título">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              value={program.title}
              onChange={(e) => setProgram({ ...program, title: e.target.value })}
            />
          </Field>
          <Field label="Subtítulo (opcional)">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              value={program.subtitle ?? ""}
              onChange={(e) => setProgram({ ...program, subtitle: e.target.value || undefined })}
            />
          </Field>
          <Field label="Descripción">
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              rows={4}
              value={program.description}
              onChange={(e) => setProgram({ ...program, description: e.target.value })}
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
                  setProgram((p) => ({
                    ...p,
                    metrics: { ...p.metrics, hoursPerSession: h, totalHours: h * p.metrics.sessions },
                  }));
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

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
              onClick={() => exportProgramJson(program)}
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
              onClick={() => downloadMarkdown(program)}
              type="button"
            >
              Descargar Markdown
            </button>

            <button
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              onClick={() => {
                resetProgram();
                setProgram(loadProgram());
              }}
              type="button"
            >
              Reset
            </button>
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

        <Card title="DOC / Word (preparado)">
          <p className="text-sm text-slate-600">
            Ya tenemos el <b>schema</b> (JSON) + export a Markdown. El siguiente paso para .docx es implementar un export
            con la librería <code className="rounded bg-slate-100 px-1 py-0.5">docx</code>.
          </p>
        </Card>
      </div>
    </div>
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">
          Sesión {session.index} de {total}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Título">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            value={session.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </Field>
        <Field label="Fecha (texto)">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            value={session.dateText}
            onChange={(e) => onChange({ dateText: e.target.value })}
          />
        </Field>
        <Field label="Horario (texto)">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
            value={session.timeText}
            onChange={(e) => onChange({ timeText: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-6">
        <ListEditor
          title="Objetivos de aprendizaje"
          items={session.learningObjectives}
          onChange={(items) => onChange({ learningObjectives: items })}
        />
      </div>

      <div className="mt-6">
        <AgendaEditor
          agenda={session.agenda}
          onChange={(agenda) => onChange({ agenda })}
        />
      </div>

      <div className="mt-6">
        <ListEditor
          title="Materiales"
          items={session.materials}
          onChange={(items) => onChange({ materials: items })}
        />
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
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
      <div className="text-sm font-semibold text-slate-900">Desglose horario</div>
      <div className="mt-3 space-y-3">
        {agenda.map((a, idx) => (
          <div key={idx} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Hora">
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                  value={a.time}
                  onChange={(e) => onChange(agenda.map((x, i) => (i === idx ? { ...x, time: e.target.value } : x)))}
                />
              </Field>
              <Field label="Título">
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                  value={a.title}
                  onChange={(e) => onChange(agenda.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))}
                />
              </Field>
              <Field label="Duración (min)">
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                  value={a.durationMin}
                  onChange={(e) =>
                    onChange(
                      agenda.map((x, i) =>
                        i === idx ? { ...x, durationMin: Number(e.target.value || 0) } : x
                      )
                    )
                  }
                />
              </Field>
            </div>
            <Field label="Notas (opcional)">
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
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
