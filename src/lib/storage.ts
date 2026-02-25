import type { Program } from "./types";
import { defaultProgram } from "./defaultProgram";

const KEY = "activitycards.program.v1";

export function loadProgram(): Program {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgram;
    const parsed = JSON.parse(raw) as Program;
    if (!parsed?.title || !Array.isArray(parsed.sessions)) return defaultProgram;
    return parsed;
  } catch {
    return defaultProgram;
  }
}

export function saveProgram(program: Program) {
  localStorage.setItem(KEY, JSON.stringify(program));
}

export function resetProgram() {
  localStorage.removeItem(KEY);
}

export function exportProgramJson(program: Program) {
  const blob = new Blob([JSON.stringify(program, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "activitycards.program.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function importProgramJson(file: File): Promise<Program> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Program;
        if (!parsed?.title || !Array.isArray(parsed.sessions)) throw new Error("Invalid JSON");
        resolve(parsed);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
