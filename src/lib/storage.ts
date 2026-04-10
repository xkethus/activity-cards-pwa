import type { ActivityDoc, Program } from "./types";
import { defaultDoc } from "./defaultProgram";

const KEY = "activitycards.doc.v1";

/** Nombre de archivo seguro basado en el título de la ficha */
export function fichaFileName(doc: ActivityDoc): string {
  const raw = doc.kind === "sessions" ? doc.program.title : doc.activity.title;
  const safe = (raw || "ficha")
    .replace(/[<>:"/\\|?*]/g, "")
    .trim()
    .slice(0, 60);
  return safe || "ficha";
}

function looksLikeLegacyProgram(x: unknown): x is Program {
  const p = x as any;
  return !!p && typeof p === "object" && typeof p.title === "string" && Array.isArray(p.sessions);
}

export function loadDoc(): ActivityDoc {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultDoc;
    const parsed = JSON.parse(raw) as ActivityDoc;

    // New format
    if (parsed && typeof parsed === "object" && "kind" in parsed) {
      const k = (parsed as any).kind;
      if (k === "sessions" && (parsed as any).program) return parsed as ActivityDoc;
      if (k === "artistic" && (parsed as any).activity) return parsed as ActivityDoc;
      if (k === "course" && (parsed as any).activity) return parsed as ActivityDoc;
    }

    // Legacy fallback (stored a Program directly)
    if (looksLikeLegacyProgram(parsed)) {
      return { kind: "sessions", program: parsed };
    }

    return defaultDoc;
  } catch {
    return defaultDoc;
  }
}

export function saveDoc(doc: ActivityDoc) {
  localStorage.setItem(KEY, JSON.stringify(doc));
}

export function resetDoc() {
  localStorage.removeItem(KEY);
}

export function exportDocJson(doc: ActivityDoc) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Ficha - ${fichaFileName(doc)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Descarga la ficha digital (JSON) + abre la vista de impresión en pestaña nueva.
 * El usuario solo ve "Descargar ficha" — sin mencionar JSON.
 */
export function saveFichaBundle(doc: ActivityDoc) {
  exportDocJson(doc);
  window.open("#/print", "_blank", "noopener");
}

export function importDocJson(file: File): Promise<ActivityDoc> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as ActivityDoc;
        if (!parsed || typeof parsed !== "object" || !("kind" in parsed)) throw new Error("Invalid JSON");
        resolve(parsed);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
