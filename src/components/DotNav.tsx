import { motion } from "framer-motion";

export function DotNav({
  items,
  activeId,
  onSelect,
}: {
  items: { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const activeIndex = Math.max(
    0,
    items.findIndex((x) => x.id === activeId)
  );

  return (
    <div className="sticky top-6">
      <div className="relative rounded-3xl bg-white/80 p-3 shadow-sm ring-1 ring-black/5 backdrop-blur">
        {/* highlight pill */}
        <motion.div
          className="absolute left-3 right-3 rounded-2xl bg-slate-900/5"
          animate={{
            top: 8 + activeIndex * 36,
            height: 30,
          }}
          transition={{ type: "spring", stiffness: 450, damping: 40 }}
        />

        <div className="relative flex flex-col gap-1">
          {items.map((it) => {
            const active = it.id === activeId;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onSelect(it.id)}
                className="group flex items-center gap-3 rounded-2xl px-3 py-2 text-left"
                aria-current={active ? "step" : undefined}
              >
                <motion.span
                  className={
                    "inline-block h-3 w-3 rounded-full ring-1 ring-black/10 " +
                    (active ? "bg-indigo-600" : "bg-slate-200 group-hover:bg-slate-300")
                  }
                  animate={{ scale: active ? 1.25 : 1 }}
                  transition={{ type: "spring", stiffness: 600, damping: 35 }}
                />
                <span className={"text-sm " + (active ? "font-semibold text-slate-900" : "text-slate-600")}>{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
