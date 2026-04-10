import type { Program } from "../lib/types";

export function ProgramHero({ program }: { program: Program }) {
  return (
    <header className="mx-auto max-w-5xl px-4 pt-10 pb-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex w-fit items-center gap-3 rounded-full bg-white/70 px-4 py-2 shadow-sm ring-1 ring-black/5">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-medium text-slate-700">{program.subtitle ?? "Programa"}</span>
        </div>

        <h1 className="mx-auto max-w-3xl text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {program.title}
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-pretty text-base leading-relaxed text-slate-600">
          {program.description}
        </p>

        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-3 gap-3">
          <Metric label="Total de Sesiones" value={`${program.metrics.sessions} sesiones`} />
          <Metric label="Duración" value={`${program.metrics.hoursPerSession} horas c/u`} />
          <Metric label="Total de Horas" value={`${program.metrics.totalHours} horas`} />
        </div>
      </div>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 px-4 py-3 text-center shadow-sm ring-1 ring-black/5">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-indigo-600">{value}</div>
    </div>
  );
}
