import type { ActivityDoc } from "./types";
import type { Role } from "./roles";
import { defaultDoc } from "./defaultProgram";

export type DocStatus = "BORRADOR" | "ENVIADA" | "APROBADA" | "RECHAZADA";

export type UserRecord = {
  id: string;
  name: string;
  role: Role;
  // Nota: offline-only. Esto NO es seguridad real.
  accessCode: string;
};

export type ActivityRecord = {
  id: string;
  ownerId: string;
  status: DocStatus;
  createdAt: number;
  updatedAt: number;
  validatedBy?: string;
  validatedAt?: number;
  validationNotes?: string;
  doc: ActivityDoc;
};

const USERS_KEY = "activitycards.users.v1";
const DOCS_KEY = "activitycards.docs.v1";
const ACTIVE_DOC_KEY = "activitycards.activeDocId.v1";

function uid(prefix = "doc") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function deriveTitle(doc: ActivityDoc): string {
  if (doc.kind === "sessions") return doc.program.title || "(Sin título)";
  // artistic/course
  return doc.activity.title || "(Sin título)";
}

export function loadUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUsers(users: UserRecord[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function ensureSeedUsers() {
  const users = loadUsers();
  if (users.length) return;
  // Primer arranque: usuario admin por defecto.
  // IMPORTANTE: es solo para modo offline; se debe cambiar.
  saveUsers([
    {
      id: "admin",
      name: "Admin local",
      role: "ADMIN",
      accessCode: "admin",
    },
  ]);
}

export function findUserByAccessCode(code: string): UserRecord | null {
  const users = loadUsers();
  const normalized = code.trim();
  return users.find((u) => u.accessCode === normalized) ?? null;
}

function parseTimeRangeToStartEnd(timeText: string): { startTime: string; endTime: string } {
  const t = (timeText || "").trim();
  const m = t.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (!m) return { startTime: "", endTime: "" };
  const startTime = m[1].padStart(5, "0");
  const endTime = m[2].padStart(5, "0");
  return { startTime, endTime };
}

function migrateCourseSessions(activity: any) {
  if (!activity || !Array.isArray(activity.sessions)) return activity;
  // If already migrated
  if (activity.sessions[0] && "dateISO" in activity.sessions[0]) return activity;

  const migratedSessions = activity.sessions.map((s: any, idx: number) => {
    const index = Number(s.index || idx + 1);
    const { startTime, endTime } = parseTimeRangeToStartEnd(String(s.timeText || ""));
    return {
      index,
      title: s.title || "",
      dateISO: "",
      startTime,
      endTime,
      durationHours: Number(s.durationHours || activity.hoursPerSession || 1),
    };
  });

  return {
    ...activity,
    sessionsCount: Number(activity.sessionsCount || migratedSessions.length || 1),
    hoursPerSession: Number(activity.hoursPerSession || 3),
    sessions: migratedSessions,
  };
}

export function loadDocs(): ActivityRecord[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ActivityRecord[];
      const docs = Array.isArray(parsed) ? parsed : [];
      // migrate docs in-place (best effort)
      const migrated = docs.map((d: any) => {
        if (d?.doc?.kind === "course") {
          return { ...d, doc: { ...d.doc, activity: migrateCourseSessions(d.doc.activity) } };
        }
        return d;
      });
      if (JSON.stringify(migrated) !== JSON.stringify(docs)) saveDocs(migrated as any);
      return migrated as any;
    }

    // Migración: versión anterior guardaba un solo doc en activitycards.doc.v1
    const legacyRaw = localStorage.getItem("activitycards.doc.v1");
    if (legacyRaw) {
      const legacyDoc = JSON.parse(legacyRaw) as ActivityDoc;
      const now = Date.now();
      const migrated: ActivityRecord = {
        id: uid(),
        ownerId: "admin",
        status: "BORRADOR",
        createdAt: now,
        updatedAt: now,
        doc: legacyDoc,
      };
      saveDocs([migrated]);
      setActiveDocId(migrated.id);
      return [migrated];
    }

    return [];
  } catch {
    return [];
  }
}

export function saveDocs(docs: ActivityRecord[]) {
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
}

export function getActiveDocId(): string | null {
  return localStorage.getItem(ACTIVE_DOC_KEY);
}

export function setActiveDocId(id: string | null) {
  if (!id) localStorage.removeItem(ACTIVE_DOC_KEY);
  else localStorage.setItem(ACTIVE_DOC_KEY, id);
}

export function getOrCreateFirstDoc(ownerId: string): ActivityRecord {
  const docs = loadDocs();
  if (docs.length) return docs[0];

  const now = Date.now();
  const rec: ActivityRecord = {
    id: uid(),
    ownerId,
    status: "BORRADOR",
    createdAt: now,
    updatedAt: now,
    doc: defaultDoc,
  };
  saveDocs([rec]);
  setActiveDocId(rec.id);
  return rec;
}

export function getDocById(id: string): ActivityRecord | null {
  const docs = loadDocs();
  return docs.find((d) => d.id === id) ?? null;
}

export function upsertDoc(rec: ActivityRecord) {
  const docs = loadDocs();
  const idx = docs.findIndex((d) => d.id === rec.id);
  if (idx >= 0) docs[idx] = rec;
  else docs.unshift(rec);
  saveDocs(docs);
}

export function createDoc(ownerId: string, doc: ActivityDoc): ActivityRecord {
  const now = Date.now();
  const rec: ActivityRecord = {
    id: uid(),
    ownerId,
    status: "BORRADOR",
    createdAt: now,
    updatedAt: now,
    doc,
  };
  upsertDoc(rec);
  setActiveDocId(rec.id);
  return rec;
}
