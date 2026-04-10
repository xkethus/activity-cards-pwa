import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function toISODate(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromISODate(iso: string): Date | null {
  const m = (iso || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const date = new Date(y, mo, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function DatePickerField({
  valueISO,
  onChangeISO,
}: {
  valueISO: string;
  onChangeISO: (iso: string) => void;
}) {
  const value = fromISODate(valueISO);
  return (
    <DatePicker
      selected={value}
      onChange={(d: Date | null) => onChangeISO(toISODate(d))}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
      dateFormat="dd/MM/yyyy"
      placeholderText="dd/mm/aaaa"
      isClearable
      showPopperArrow={false}
    />
  );
}
