import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadAuth } from "../lib/auth";
import { deriveTitle, loadDocs, setActiveDocId, upsertDoc, type ActivityRecord } from "../lib/db";
import { hasPermission } from "../lib/roles";
import { ConfirmDialog } from "../components/ConfirmDialog";

type PendingAction =
  | { id: string; action: "approve" }
  | { id: string; action: "reject" }
  | { id: string; action: "draft" };

export function DirectorPage() {
  const nav = useNavigate();
  const auth = loadAuth();
  const [docs, setDocs] = useState<ActivityRecord[]>(() => loadDocs());
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

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

  function executeAction(reason?: string) {
    if (!pendingAction || !auth) return;
    const { id, action } = pendingAction;

    if (action === "approve") {
      update(id, { status: "APROBADA", validatedBy: auth.userId, validatedAt: Date.now() });
    } else if (action === "reject") {
      update(id, {
        status: "RECHAZADA",
        validatedBy: auth.userId,
        validatedAt: Date.now(),
        validationNotes: reason,
      });
    } else if (action === "draft") {
      update(id, { status: "BORRADOR" });
    }

    setPendingAction(null);
  }

  const actionDoc = pendingAction ? docs.find((d) => d.id === pendingAction.id) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* ── Confirmation dialogs ── */}
      {pendingAction?.action === "approve" && actionDoc ? (
        <ConfirmDialog
          title="Aprobar ficha"
          message={`¿Confirmas la aprobación de "${deriveTitle(actionDoc.doc)}"? El creador podrá verla como aprobada.`}
          confirmLabel="Sí, aprobar"
          onConfirm={executeAction}
          onCancel={() => setPendingAction(null)}
        />
      ) : null}

      {pendingAction?.action === "reject" && actionDoc ? (
        <ConfirmDialog
          title="Rechazar ficha"
          message={`¿Rechazar "${deriveTitle(actionDoc.doc)}"? Escribe el motivo para que el creador sepa qué corregir.`}
          confirmLabel="Rechazar"
          danger
          requireReason
          reasonLabel="Motivo del rechazo"
          reasonPlaceholder="Ej. Falta objetivo claro, temario incompleto, corregir semblanza..."
          onConfirm={executeAction}
          onCancel={() => setPendingAction(null)}
        />
      ) : null}

      {pendingAction?.action === "draft" && actionDoc ? (
        <ConfirmDialog
          title="Regresar a borrador"
          message={`¿Regresar "${deriveTitle(actionDoc.doc)}" a borrador? El creador podrá volver a editarla.`}
          confirmLabel="Sí, regresar"
          onConfirm={executeAction}
          onCancel={() => setPendingAction(null)}
        />
      ) : null}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Validación</h1>
        <Link
          to="/"
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
        >
          Menú
        </Link>
      </div>

      <div className="mt-2 text-sm text-slate-600">Fichas en espera de validación.</div>

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
                    onClick={() => { setActiveDocId(d.id); nav("/view"); }}
                  >
                    Ver
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    onClick={() => { setActiveDocId(d.id); nav("/edit"); }}
                  >
                    Editar
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  onClick={() => setPendingAction({ id: d.id, action: "approve" })}
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                  onClick={() => setPendingAction({ id: d.id, action: "reject" })}
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
                  onClick={() => setPendingAction({ id: d.id, action: "draft" })}
                >
                  Regresar a borrador
                </button>
              </div>

              {/* Show rejection notes if already rejected */}
              {d.validationNotes ? (
                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-black/5">
                  <span className="font-semibold">Notas:</span> {d.validationNotes}
                </div>
              ) : (
                <div className="mt-3">
                  <label className="block">
                    <div className="mb-1 text-sm font-medium text-slate-700">Notas de validación (opcional)</div>
                    <textarea
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      rows={2}
                      value={d.validationNotes ?? ""}
                      onChange={(e) => update(d.id, { validationNotes: e.target.value })}
                      placeholder="Observaciones generales para el creador..."
                    />
                  </label>
                </div>
              )}
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
