import { useMemo } from "react";
import { DatePickerField } from "./DatePickerField";
import { formatDateDMY, formatTimeToH } from "../lib/format";

function parseExisting(value: string): { dateISO: string; startTime: string; endTime: string } {
  // Best-effort: supports "dd/mm/yyyy · 16h–19h" or "dd/mm/yyyy · 16:00-19:00" and similar.
  const v = (value || "").trim();
  const mDate = v.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const dateISO = mDate ? `${mDate[3]}-${mDate[2]}-${mDate[1]}` : "";
  const mTime = v.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  const startTime = mTime ? mTime[1].padStart(5, "0") : "";
  const endTime = mTime ? mTime[2].padStart(5, "0") : "";
  return { dateISO, startTime, endTime };
}

export function DateTimeRangeField({
  value,
  onChange,
  dateLabel = "Fecha",
  startLabel = "Inicio",
  endLabel = "Fin",
}: {
  value: string;
  onChange: (value: string) => void;
  dateLabel?: string;
  startLabel?: string;
  endLabel?: string;
}) {
  const parsed = useMemo(() => parseExisting(value), [value]);

  const dateISO = parsed.dateISO;
  const startTime = parsed.startTime;
  const endTime = parsed.endTime;

  const set = (next: { dateISO: string; startTime: string; endTime: string }) => {
    const date = formatDateDMY(next.dateISO);
    const s = formatTimeToH(next.startTime);
    const e = formatTimeToH(next.endTime);
    const time = s && e ? `${s}–${e}` : s || e;
    const out = date && time ? `${date} · ${time}` : date || time || "";
    onChange(out);
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <label className="block">
        <div className="mb-1 text-sm font-medium text-slate-700">{dateLabel}</div>
        <DatePickerField valueISO={dateISO} onChangeISO={(iso) => set({ dateISO: iso, startTime, endTime })} />
      </label>
      <label className="block">
        <div className="mb-1 text-sm font-medium text-slate-700">{startLabel}</div>
        <input
          type="time"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
          value={startTime}
          onChange={(e) => set({ dateISO, startTime: e.target.value, endTime })}
        />
      </label>
      <label className="block">
        <div className="mb-1 text-sm font-medium text-slate-700">{endLabel}</div>
        <input
          type="time"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
          value={endTime}
          onChange={(e) => set({ dateISO, startTime, endTime: e.target.value })}
        />
      </label>
    </div>
  );
}
