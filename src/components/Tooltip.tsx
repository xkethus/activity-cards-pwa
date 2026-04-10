import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function HelpTip({ text }: { text: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  function calcPos() {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    // place below the button, clamped so it never overflows the right edge
    const tooltipW = 288; // w-72
    const left = Math.min(rect.left, window.innerWidth - tooltipW - 8);
    setPos({ top: rect.bottom + 6, left: Math.max(8, left) });
  }

  return (
    <span className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 ring-1 ring-black/5 hover:bg-slate-200"
        aria-label="Ayuda"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => { calcPos(); setOpen(true); }}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => { calcPos(); setOpen(true); }}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>

      {open
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              className="pointer-events-none w-72 rounded-2xl bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg"
              style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
            >
              {text}
            </div>,
            document.body
          )
        : null}
    </span>
  );
}
