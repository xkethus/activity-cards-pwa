import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadAuth } from "../lib/auth";
import { loadUsers, saveUsers, type UserRecord } from "../lib/db";
import type { Role } from "../lib/roles";
import { ROLE_LABEL } from "../lib/roles";
import { ConfirmDialog } from "../components/ConfirmDialog";

export function AdminPage() {
  const nav = useNavigate();
  const auth = loadAuth();
  const [users, setUsers] = useState<UserRecord[]>(() => loadUsers());
  const [status, setStatus] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useMemo(() => {
    if (!auth) nav("/login");
    if (auth && auth.role !== "ADMIN") nav("/");
  }, [auth, nav]);

  if (!auth || auth.role !== "ADMIN") return null;

  function persist(next: UserRecord[]) {
    setUsers(next);
    saveUsers(next);
    setStatus("Guardado");
    setTimeout(() => setStatus(""), 1200);
  }

  function addUser() {
    const id = `u_${Math.random().toString(16).slice(2, 8)}`;
    persist([
      ...users,
      {
        id,
        name: "Nuevo usuario",
        role: "CREATOR",
        accessCode: "",
      },
    ]);
  }

  const userToDelete = deletingId ? users.find((u) => u.id === deletingId) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {deletingId && userToDelete ? (
        <ConfirmDialog
          title="Eliminar usuario"
          message={`¿Eliminar a "${userToDelete.name}"? Sus fichas quedarán huérfanas pero no se borrarán.`}
          confirmLabel="Sí, eliminar"
          danger
          onConfirm={() => {
            persist(users.filter((x) => x.id !== deletingId));
            setDeletingId(null);
          }}
          onCancel={() => setDeletingId(null)}
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Administración</h1>
        <Link
          to="/"
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50"
        >
          Menú
        </Link>
      </div>

      <div className="mt-2 text-sm text-slate-600">
        Usuarios y códigos de acceso (modo offline). <b>No es seguridad real</b>, pero evita errores y delimita flujos.
      </div>

      {status ? (
        <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">{status}</div>
      ) : null}

      <div className="mt-6 space-y-3">
        {users.map((u) => (
          <div key={u.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Field label="Nombre">
                <input
                  className={inputCls}
                  value={u.name}
                  onChange={(e) => persist(users.map((x) => (x.id === u.id ? { ...x, name: e.target.value } : x)))}
                />
              </Field>
              <Field label="Rol">
                <select
                  className={inputCls}
                  value={u.role}
                  onChange={(e) => persist(users.map((x) => (x.id === u.id ? { ...x, role: e.target.value as Role } : x)))}
                >
                  {Object.entries(ROLE_LABEL).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Código">
                <input
                  className={inputCls}
                  value={u.accessCode}
                  onChange={(e) => persist(users.map((x) => (x.id === u.id ? { ...x, accessCode: e.target.value } : x)))}
                  placeholder="Ej. 1234"
                />
              </Field>
              <div className="flex items-end justify-end">
                <button
                  type="button"
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                  onClick={() => setDeletingId(u.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">ID: {u.id}</div>
          </div>
        ))}

        <button
          type="button"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          onClick={addUser}
        >
          + Agregar usuario
        </button>
      </div>
    </div>
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
