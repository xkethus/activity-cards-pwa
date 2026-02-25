import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadAuth } from "../lib/auth";
import { deriveTitle, loadDocs, setActiveDocId, upsertDoc, type ActivityRecord } from "../lib/db";
import { hasPermission } from "../lib/roles";

export function DirectorPage() {
  const nav = useNavigate();
  const auth = loadAuth();
  const [docs, setDocs] = useState<ActivityRecord[]>(() => loadDocs());

  useMemo(() => {
    if (!auth) nav("/login");
    if (auth && !hasPermission(auth.role, "DOC_VALIDATE")) nav("/");
  }, [auth, nav]);

  if (!auth || !hasPermission(auth.role, "DOC_VALIDATE")) return null;

  const pending = docs.filter((d) => d.status === "ENVIADA").sort((a, b) => b.updatedAt - a.updatedAt);

  function update(id: string, patch: Partial<ActivityRecord>) {
    const next = docs.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d));
    setDocs(next);
    const rec = next.find((d) => d.id === id);
    if (rec) upsertDoc(rec);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Validación</h1>
        <Link
          to="/"
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
        >
          Menú
        </Link>
      </div>

      <div className="mt-2 text-sm text-slate-600">Aquí aparecen las fichas con estado “Enviada”.</div>

      <div className="mt-6 space-y-3">
        {pending.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-black/5">
            No hay fichas pendientes.
          </div>
        ) : (
          pending.map((d) => (
            <div key={d.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{deriveTitle(d.doc)}</div>
                  <div className="mt-1 text-xs text-slate-500">Tipo: {labelKind(d.doc.kind)}</div>
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
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  onClick={() =>
                    update(d.id, {
                      status: "APROBADA",
                      validatedBy: auth.userId,
                      validatedAt: Date.now(),
                    })
                  }
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                  onClick={() =>
                    update(d.id, {
                      status: "RECHAZADA",
                      validatedBy: auth.userId,
                      validatedAt: Date.now(),
                    })
                  }
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
                  onClick={() =>
                    update(d.id, {
                      status: "BORRADOR",
                    })
                  }
                >
                  Regresar a borrador
                </button>
              </div>

              <div className="mt-3">
                <label className="block">
                  <div className="mb-1 text-sm font-medium text-slate-700">Notas de validación (opcional)</div>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
                    rows={3}
                    value={d.validationNotes ?? ""}
                    onChange={(e) => update(d.id, { validationNotes: e.target.value })}
                  />
                </label>
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
