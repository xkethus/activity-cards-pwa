export function StepCard({
  title,
  subtitle,
  stepText,
  children,
}: {
  title: string;
  subtitle?: string;
  stepText?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
      <header className="relative border-b border-black/10 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-wide text-neutral-300/80">{stepText ?? ""}</div>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-neutral-200">{title}</h2>
            {subtitle ? <p className="mt-2 text-sm text-neutral-300/80">{subtitle}</p> : null}
          </div>
          {stepText ? (
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-200 ring-1 ring-white/10">
              {stepText}
            </div>
          ) : null}
        </div>
        {/* subtle graphite texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 1px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 6px)",
        }} />
      </header>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}
