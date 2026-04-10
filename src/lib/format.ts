import type { FixedSchedule } from "./types";

const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2026-04-12" → "12 abr 2026" */
export function formatDateShort(dateISO: string): string {
  const m = (dateISO || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const month = MONTHS_ES[parseInt(m[2], 10) - 1];
  return `${parseInt(m[3], 10)} ${month} ${m[1]}`;
}

/** Renders a FixedSchedule as a human-readable string */
export function formatFixedSchedule(fs: FixedSchedule): string {
  const parts: string[] = [];
  const start = formatDateShort(fs.startDateISO);
  const end = formatDateShort(fs.endDateISO);
  if (start && end) parts.push(`${start} – ${end}`);
  else if (start) parts.push(`Desde ${start}`);
  else if (end) parts.push(`Hasta ${end}`);
  if (fs.weekdays.length > 0) parts.push(fs.weekdays.join(", "));
  if (fs.startTime && fs.endTime) parts.push(`${fs.startTime} – ${fs.endTime} h`);
  else if (fs.startTime) parts.push(`Desde las ${fs.startTime}`);
  return parts.join("   ·   ");
}

export function formatTimeToH(time: string): string {
  const t = (time || "").trim();
  if (!t) return "";
  // Accept HH:mm
  const m = t.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return t;
  const hh = m[1];
  const mm = m[2];
  if (mm === "00") return `${Number(hh)}h`;
  return `${hh}:${mm}h`;
}

export function formatDateDMY(dateISO: string): string {
  const d = (dateISO || "").trim();
  // expecting YYYY-MM-DD
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return d;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function formatSessionSchedule({
  dateISO,
  startTime,
  endTime,
}: {
  dateISO: string;
  startTime: string;
  endTime: string;
}): string {
  const date = formatDateDMY(dateISO);
  const s = formatTimeToH(startTime);
  const e = formatTimeToH(endTime);
  const time = s && e ? `${s}–${e}` : s || e;
  if (date && time) return `${date} · ${time}`;
  return date || time || "";
}
