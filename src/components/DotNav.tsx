import { motion } from "framer-motion";

export type DotStatus = "empty" | "partial" | "ok";

export function DotNav({
  items,
  activeId,
  onSelect,
}: {
  items: { id: string; label: string; status?: DotStatus }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const activeIndex = Math.max(0, items.findIndex((x) => x.id === activeId));

  return (
    <>
      {/* ─────────────────────────────────────────
          MOBILE  — horizontal compact strip
          No sticky: stays in flow, never overlaps
      ───────────────────────────────────────── */}
      <div className="sm:hidden">
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-sm ring-1 ring-black/5 backdrop-blur">
          {items.map((it) => {
            const active = it.id === activeId;
            const status = it.status ?? "empty";
            const dotColor = active
              ? "bg-indigo-600"
              : status === "ok"
                ? "bg-emerald-500"
                : status === "partial"
                  ? "bg-amber-400"
                  : "bg-slate-200";

            return (
              <button
                key={it.id}
                type="button"
                aria-label={it.label}
                aria-current={active ? "step" : undefined}
                onClick={() => onSelect(it.id)}
                className="flex items-center justify-center"
              >
                <motion.span
                  className={"inline-block rounded-full ring-1 ring-black/10 " + dotColor}
                  animate={{
                    width: active ? 10 : 8,
                    height: active ? 10 : 8,
                    scale: active ? 1.2 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 600, damping: 35 }}
                  style={{ display: "inline-block" }}
                />
              </button>
            );
          })}
        </div>

        {/* Active step label shown below the dots */}
        <motion.div
          key={activeId}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="mt-1.5 text-center text-xs font-semibold text-slate-700"
        >
          {items[activeIndex]?.label}
        </motion.div>
      </div>

      {/* ─────────────────────────────────────────
          DESKTOP  — vertical sticky sidebar
          Only visible sm and up
      ───────────────────────────────────────── */}
      <div className="hidden sm:block sm:sticky sm:top-6">
        <div className="relative rounded-3xl bg-white/80 p-3 shadow-sm ring-1 ring-black/5 backdrop-blur">
          {/* animated highlight pill
              Each button = py-2 (16px) + text-sm line-height (20px) = 36px
              gap-1 between items = 4px  →  stride = 40px
              container p-3 = 12px top offset
          */}
          <motion.div
            className="absolute left-3 right-3 rounded-2xl bg-slate-900/5"
            animate={{
              top: 12 + activeIndex * 40,
              height: 36,
            }}
            transition={{ type: "spring", stiffness: 450, damping: 40 }}
          />

          <div className="relative flex flex-col gap-1">
            {items.map((it) => {
              const active = it.id === activeId;
              const status = it.status ?? "empty";
              const dotCls =
                status === "ok"
                  ? "bg-emerald-500"
                  : status === "partial"
                    ? "bg-amber-400"
                    : "bg-slate-200 group-hover:bg-slate-300";

              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => onSelect(it.id)}
                  className="group flex items-center gap-3 rounded-2xl px-3 py-2 text-left"
                  aria-current={active ? "step" : undefined}
                >
                  <motion.span
                    className={"inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10 " + (active ? "bg-indigo-600" : dotCls)}
                    animate={{ scale: active ? 1.25 : 1 }}
                    transition={{ type: "spring", stiffness: 600, damping: 35 }}
                  />
                  <span className={"min-w-0 truncate text-sm " + (active ? "font-semibold text-slate-900" : "text-slate-600")}>
                    {it.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
