import type { ActivityDoc } from "../lib/types";
import { formatDateDMY, formatTimeToH } from "../lib/format";

export function toMarkdown(doc: ActivityDoc): string {
  if (doc.kind === "sessions") {
    const program = doc.program;
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

  if (doc.kind === "artistic") {
    const a = doc.activity;
    return [
      `# ${a.title || "(Sin título)"}`,
      "",
      `**Participantes:** ${a.participants}`,
      `**Laboratorio:** ${a.organizingLab}`,
      `**Ciclo:** ${a.cycleName}`,
      `**Colaboración:** ${a.collaboration}`,
      "",
      `## Descripción`,
      a.description,
      "",
      `- Modalidad: ${a.modality}`,
      `- Fecha y horarios: ${a.dateAndTime}`,
      `- Ensayos: ${a.rehearsalSchedule}`,
      `- Montaje: ${a.setupSchedule}`,
      `- Lugar: ${a.place}`,
      "",
      `## Requerimientos técnicos`,
      `- Internet: ${a.tech.internet}`,
      `- Montaje: ${a.tech.setup}`,
      `- Ensayos: ${a.tech.rehearsal}`,
      `- Transmisión: ${a.tech.broadcast}`,
      `- Proyección/Audio: ${a.tech.projectionAudio}`,
      `- Otros: ${a.tech.other}`,
      "",
      `## Difusión`,
      `- Líneas fuerza: ${a.promoLines}`,
      `- Recursos atención al público: ${a.audienceResources}`,
      `- Palabras clave: ${a.keywords}`,
      "",
    ].join("\n");
  }

  // course
  const c = doc.activity;
  return [
    `# ${c.title || "(Sin título)"}`,
    "",
    `**Tipo:** ${c.typeLabel}`,
    `**Imparte:** ${c.instructor}`,
    `**Laboratorio:** ${c.organizingLab}`,
    `**Contacto:** ${c.contactEmail}`,
    "",
    `- Sesiones: ${c.sessionsCount} · ${c.hoursPerSession} horas por sesión`,
    `- Fecha y horarios: ${c.dateAndTime}`,
    `- Lugar: ${c.place}`,
    `- Serie/ciclo: ${c.seriesInfo}`,
    `- Colaboración: ${c.collaboration}`,
    `- Modalidad: ${c.modality}`,
    "",
    `## Programa por sesiones`,
    ...c.sessions
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((s) => {
        const date = formatDateDMY(s.dateISO) || "(Fecha por definir)";
        const start = formatTimeToH(s.startTime);
        const end = formatTimeToH(s.endTime);
        const time = start && end ? `${start}–${end}` : start || end || "(Horario por definir)";
        const title = s.title?.trim() ? ` — ${s.title.trim()}` : "";
        return `- Sesión ${s.index}: ${date} · ${time} · ${s.durationHours}h${title}`;
      }),
    "",
    `## Objetivo`,
    c.objective,
    "",
    `## Justificación`,
    c.justification,
    "",
    `## Temario`,
    c.syllabus,
    "",
    `## Metodología`,
    c.methodology,
    "",
    `## Perfil de ingreso`,
    c.entryProfile,
    "",
    `## Número de asistentes`,
    c.attendees,
    "",
    `## Materiales`,
    `${c.materials}${c.materialFee ? `\n\nCuota: ${c.materialFee}` : ""}`,
    "",
    `## Requerimientos técnicos`,
    `- Internet: ${c.tech.internet}`,
    `- Montaje: ${c.tech.setup}`,
    `- Transmisión: ${c.tech.broadcast}`,
    `- Proyección/Audio: ${c.tech.projectionAudio}`,
    `- Otros: ${c.tech.other}`,
    "",
  ].join("\n");
}

export function downloadMarkdown(doc: ActivityDoc) {
  const md = toMarkdown(doc);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "activitycards.doc.md";
  a.click();
  URL.revokeObjectURL(url);
}
