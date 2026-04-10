export function SessionNav({
  total,
  active,
  onSelect,
}: {
  total: number;
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: total }, (_, i) => i + 1).map((i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={
                "rounded-full px-3 py-2 text-sm font-medium ring-1 transition " +
                (isActive
                  ? "bg-indigo-600 text-white ring-indigo-600"
                  : "bg-white/70 text-slate-700 ring-black/5 hover:bg-white")
              }
            >
              Ir a sesión {i}
            </button>
          );
        })}
      </div>
    </div>
  );
}
