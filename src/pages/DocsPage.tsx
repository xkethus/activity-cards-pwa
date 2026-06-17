import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadAuth } from "../lib/auth";
import { createDoc, deleteDoc, deriveTitle, loadDocs, setActiveDocId, type ActivityRecord } from "../lib/db";
import { hasPermission } from "../lib/roles";
import { importDocJson } from "../lib/storage";

function formatStatus(s: ActivityRecord["status"]) {
  switch (s) {
    case "BORRADOR":
      return "Borrador";
    case "ENVIADA":
      return "Enviada";
    case "APROBADA":
      return "Aprobada";
    case "RECHAZADA":
      return "Rechazada";
  }
}

export function DocsPage() {
  const nav = useNavigate();
  const auth = loadAuth();
  const [q, setQ] = useState("");
  const [qInstructor, setQInstructor] = useState("");
  const [qMonth, setQMonth] = useState(""); // "YYYY-MM" | ""
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-imported
    setImportError("");
    importDocJson(file)
      .then((doc) => {
        if (!auth) return;
        const rec = createDoc(auth.userId, doc);
        setActiveDocId(rec.id);
        nav("/view");
      })
      .catch(() => setImportError("El archivo no es una ficha válida. Asegúrate de usar un archivo .json exportado desde esta herramienta."));
  }

  const [docs, setDocs] = useState(() => loadDocs());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!auth) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Necesitas entrar.
        </div>
        <Link className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" to="/login">
          Entrar
        </Link>
      </div>
    );
  }

  const canSeeAll = hasPermission(auth.role, "DOC_VIEW_ALL");

  const visible = docs.filter((d) => {
    if (canSeeAll) return true;
    if (auth.role === "CREATOR") return d.ownerId === auth.userId || d.status !== "BORRADOR";
    // VIEWER
    return d.status !== "BORRADOR";
  });

  const filtered = visible.filter((d) => {
    if (q.trim() && !deriveTitle(d.doc).toLowerCase().includes(q.trim().toLowerCase())) return false;
    if (qInstructor.trim()) {
      const person = deriveInstructor(d).toLowerCase();
      if (!person.includes(qInstructor.trim().toLowerCase())) return false;
    }
    if (qMonth) {
      const ym = docYearMonth(d);
      if (ym !== qMonth) return false;
    }
    return true;
  });

  // Opciones únicas de año-mes para el selector, ordenadas desc
  const monthOptions = Array.from(new Set(visible.map(docYearMonth).filter(Boolean)))
    .sort((a, b) => b.localeCompare(a));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Input oculto para importar */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImport}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <img src="/logo.png" alt="Centro Multimedia-CENART" className="h-9 w-auto" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M9.25 3.75a.75.75 0 0 1 1.5 0v7.69l2.22-2.22a.75.75 0 1 1 1.06 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 1 1 1.06-1.06l2.22 2.22V3.75Z" />
              <path d="M3 13.25a.75.75 0 0 1 .75.75v1.75h12.5V14a.75.75 0 0 1 1.5 0v2a1.25 1.25 0 0 1-1.25 1.25H3.75A1.25 1.25 0 0 1 2.5 16v-2a.75.75 0 0 1 .5-.75Z" />
            </svg>
            Cargar ficha
          </button>
          <Link
            to="/"
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
          >
            Menú
          </Link>
        </div>
      </div>

      {importError ? (
        <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200">
          {importError}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {/* Título */}
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
            placeholder="Título…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Quien imparte */}
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
            placeholder="Quien imparte…"
            value={qInstructor}
            onChange={(e) => setQInstructor(e.target.value)}
          />
        </div>

        {/* Año / mes + limpiar */}
        <div className="flex gap-2">
          <select
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            value={qMonth}
            onChange={(e) => setQMonth(e.target.value)}
          >
            <option value="">Año / mes…</option>
            {monthOptions.map((ym) => (
              <option key={ym} value={ym}>{formatYearMonth(ym)}</option>
            ))}
          </select>
          {(q || qInstructor || qMonth) ? (
            <button
              type="button"
              className="rounded-xl bg-white px-3 py-2 text-sm text-slate-500 ring-1 ring-black/5 hover:bg-slate-50"
              onClick={() => { setQ(""); setQInstructor(""); setQMonth(""); }}
              title="Limpiar filtros"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-black/5">No hay fichas visibles.</div>
        ) : (
          filtered
            .slice()
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((d) => (
              <div key={d.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{deriveTitle(d.doc)}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Estado: <b>{formatStatus(d.status)}</b> · Tipo: <b>{labelKind(d.doc.kind)}</b>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
                      onClick={() => {
                        setActiveDocId(d.id);
                        nav("/view");
                      }}
                    >
                      Ver
                    </button>
                    {canEdit(auth.userId, auth.role, d) ? (
                      <button
                        type="button"
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        onClick={() => {
                          setActiveDocId(d.id);
                          nav("/edit");
                        }}
                      >
                        Editar
                      </button>
                    ) : null}
                    {canEdit(auth.userId, auth.role, d) ? (
                      confirmDeleteId === d.id ? (
                        <div className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 ring-1 ring-rose-200">
                          <span className="text-xs font-medium text-rose-800">¿Eliminar?</span>
                          <button
                            type="button"
                            className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                            onClick={() => {
                              deleteDoc(d.id);
                              setDocs((prev) => prev.filter((x) => x.id !== d.id));
                              setConfirmDeleteId(null);
                            }}
                          >
                            Sí
                          </button>
                          <button
                            type="button"
                            className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-black/10 hover:bg-slate-50"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-rose-600 ring-1 ring-black/5 hover:bg-rose-50"
                          onClick={() => setConfirmDeleteId(d.id)}
                        >
                          Borrar
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

function labelKind(kind: string) {
  if (kind === "sessions") return "Programa por sesiones";
  if (kind === "artistic") return "Actividad artística";
  return "Curso / Taller / Seminario";
}

function canEdit(userId: string, role: string, rec: ActivityRecord): boolean {
  if (role === "ADMIN") return true;
  if (role === "DIRECTOR") return true;
  if (role === "CREATOR") return rec.ownerId === userId;
  return false;
}

/** Extrae la persona que imparte / los participantes según el tipo de ficha */
function deriveInstructor(rec: ActivityRecord): string {
  const doc = rec.doc;
  if (doc.kind === "course") return doc.activity.instructor ?? "";
  if (doc.kind === "artistic") return doc.activity.participants ?? "";
  return "";
}

/** Devuelve "YYYY-MM" a partir del updatedAt del registro */
function docYearMonth(rec: ActivityRecord): string {
  const d = new Date(rec.updatedAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

const MONTHS_ES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

/** Formatea "YYYY-MM" → "abr 2026" */
function formatYearMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MONTHS_ES[parseInt(m, 10) - 1]} ${y}`;
}
