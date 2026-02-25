import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadAuth } from "../lib/auth";
import { createDoc } from "../lib/db";
import type { ActivityDoc, ActivityType, Program } from "../lib/types";
import {
  defaultArtisticActivity,
  defaultCourseActivity,
  defaultSessionsProgram,
} from "../lib/defaultProgram";

export function WizardPage() {
  const nav = useNavigate();
  const auth = loadAuth();

  const [kind, setKind] = useState<ActivityType>("sessions");
  const [title, setTitle] = useState("");
  const [sessions, setSessions] = useState(6);
  const [hoursPerSession, setHoursPerSession] = useState(3);

  useMemo(() => {
    if (!auth) nav("/login");
  }, [auth, nav]);

  if (!auth) return null;

  function onCreate() {
    if (!auth) return;
    const trimmedTitle = title.trim();

    let doc: ActivityDoc;
    if (kind === "sessions") {
      const p: Program = {
        ...defaultSessionsProgram,
        title: trimmedTitle || defaultSessionsProgram.title,
        metrics: {
          sessions: Math.max(1, sessions),
          hoursPerSession: Math.max(1, hoursPerSession),
          totalHours: Math.max(1, sessions) * Math.max(1, hoursPerSession),
        },
        sessions: [],
      };

      // Genera sesiones “en blanco” (para que el editor no quede enorme de entrada)
      const next = [] as Program["sessions"];
      for (let i = 1; i <= p.metrics.sessions; i++) {
        next.push({
          index: i,
          title: `Sesión ${i}`,
          dateText: "",
          timeText: "",
          learningObjectives: [""],
          agenda: [{ time: "", title: "", durationMin: 0, notes: "" }],
          materials: [""],
        });
      }
      p.sessions = next;
      doc = { kind: "sessions", program: p };
    } else if (kind === "artistic") {
      doc = {
        kind: "artistic",
        activity: { ...defaultArtisticActivity, title: trimmedTitle },
      };
    } else {
      doc = {
        kind: "course",
        activity: { ...defaultCourseActivity, title: trimmedTitle },
      };
    }

    createDoc(auth.userId, doc);
    nav("/edit");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Crear nueva ficha</h1>
        <Link
          to="/"
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
        >
          Menú
        </Link>
      </div>

      <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-700">Tipo de ficha</div>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              value={kind}
              onChange={(e) => setKind(e.target.value as ActivityType)}
            >
              <option value="sessions">Programa por sesiones</option>
              <option value="course">Curso / Taller / Seminario</option>
              <option value="artistic">Actividad artística</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-700">Título</div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Laboratorio de X"
            />
          </label>
        </div>

        {kind === "sessions" ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Número de sesiones</div>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                value={sessions}
                onChange={(e) => setSessions(Math.max(1, Number(e.target.value || 1)))}
              />
            </label>
            <label className="block">
              <div className="mb-1 text-sm font-medium text-slate-700">Horas por sesión</div>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                value={hoursPerSession}
                onChange={(e) => setHoursPerSession(Math.max(1, Number(e.target.value || 1)))}
              />
            </label>
          </div>
        ) : null}

        <button
          type="button"
          className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          onClick={onCreate}
        >
          Crear y editar
        </button>

        <div className="mt-3 text-xs text-slate-500">
          Tip: este wizard es para arrancar rápido. Luego ajustas todo en el editor.
        </div>
      </div>
    </div>
  );
}
