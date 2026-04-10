import { useId, useState } from "react";

export function HelpTip({ text }: { text: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 ring-1 ring-black/5 hover:bg-slate-200"
        aria-label="Ayuda"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>

      {open ? (
        <div
          id={id}
          role="tooltip"
          className="absolute left-0 top-7 z-30 w-72 rounded-2xl bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg"
        >
          {text}
        </div>
      ) : null}
    </span>
  );
}
