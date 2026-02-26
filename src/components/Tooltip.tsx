import { useEffect, useId, useRef, useState } from "react";

export function HelpTip({ text }: { text: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open) return;
      const el = ref.current;
      if (!el) return;
      if (el.contains(e.target as any)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 ring-1 ring-black/5 hover:bg-slate-200"
        aria-label="Ayuda"
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
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
