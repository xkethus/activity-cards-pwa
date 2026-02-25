import type { Program } from "../lib/types";

export function toMarkdown(program: Program): string {
  const lines: string[] = [];
  lines.push(`# ${program.title}`);
  if (program.subtitle) lines.push(`**${program.subtitle}**`);
  lines.push("");
  lines.push(program.description);
  lines.push("");
  lines.push(`- Total de sesiones: **${program.metrics.sessions}**`);
  lines.push(`- Duración: **${program.metrics.hoursPerSession} horas** c/u`);
  lines.push(`- Total de horas: **${program.metrics.totalHours}**`);
  lines.push("");

  for (const s of program.sessions) {
    lines.push(`---`);
    lines.push("");
    lines.push(`## Sesión ${s.index} de ${program.metrics.sessions}`);
    lines.push(`### ${s.title}`);
    lines.push("");
    lines.push(`**Fecha:** ${s.dateText}`);
    lines.push(`**Horario:** ${s.timeText}`);
    lines.push("");

    lines.push("#### Objetivos de aprendizaje");
    for (const o of s.learningObjectives) lines.push(`- ${o}`);
    lines.push("");

    lines.push("#### Desglose horario");
    for (const a of s.agenda) {
      lines.push(`- **${a.time}** (${a.durationMin} min) — ${a.title}${a.notes ? `: ${a.notes}` : ""}`);
    }
    lines.push("");

    lines.push("#### Materiales requeridos");
    for (const m of s.materials) lines.push(`- ${m}`);
    lines.push("");
  }

  return lines.join("\n");
}

export function downloadMarkdown(program: Program) {
  const md = toMarkdown(program);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "activitycards.program.md";
  a.click();
  URL.revokeObjectURL(url);
}
