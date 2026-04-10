import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadAuth } from "../lib/auth";
import { createDoc, deriveTitle, loadDocs, setActiveDocId, type ActivityRecord } from "../lib/db";
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

  const docs = useMemo(() => loadDocs(), []);

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
    const title = deriveTitle(d.doc).toLowerCase();
    return title.includes(q.trim().toLowerCase());
  });

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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Fichas</h1>
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

      <div className="mt-4">
        <input
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
          placeholder="Buscar por título…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
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

                  <div className="flex flex-wrap gap-2">
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
