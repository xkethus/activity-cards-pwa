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
      <header className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
          </div>
          {stepText ? (
            <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-black/5">
              {stepText}
            </div>
          ) : null}
        </div>
      </header>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}
