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
