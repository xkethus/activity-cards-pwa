import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
} from "docx";
import type { ActivityDoc } from "../lib/types";
import { formatDateDMY, formatTimeToH } from "../lib/format";
import { fichaFileName } from "../lib/storage";

// ── Helpers de estilo ─────────────────────────────────────────────

const FONT = "Calibri";
const COLOR_HEADING = "1E3A5F";
const COLOR_LABEL   = "64748B";
const COLOR_BODY    = "1E293B";

function h1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 200 },
    children: [new TextRun({ text, font: FONT, color: COLOR_HEADING, bold: true, size: 36 })],
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" } },
    children: [new TextRun({ text, font: FONT, color: COLOR_HEADING, bold: true, size: 26 })],
  });
}

/** "Etiqueta: valor" en una sola línea. Se omite si value está vacío. */
function kv(label: string, value: string | undefined | null): Paragraph | null {
  if (!value?.trim()) return null;
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, font: FONT, color: COLOR_LABEL, size: 20 }),
      new TextRun({ text: value, font: FONT, color: COLOR_BODY, bold: true, size: 20 }),
    ],
  });
}

/** Genera varios kv() filtrando los nulos */
function kvGroup(pairs: [string, string | undefined | null][]): Paragraph[] {
  return pairs.map(([l, v]) => kv(l, v)).filter((p): p is Paragraph => p !== null);
}

function body(text: string | undefined | null): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: text ?? "", font: FONT, color: COLOR_BODY, size: 20 })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: FONT, color: COLOR_BODY, size: 20 })],
  });
}

function empty(): Paragraph {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}

// ── Texto largo: puede tener saltos de línea → múltiples párrafos ──

function bodyLines(text: string | undefined | null): Paragraph[] {
  if (!text?.trim()) return [];
  return text.split("\n").map((line) =>
    new Paragraph({
      spacing: { after: 80 },
      bullet: line.startsWith("- ") || line.startsWith("• ") ? { level: 0 } : undefined,
      children: [
        new TextRun({
          text: line.replace(/^[-•]\s*/, ""),
          font: FONT,
          color: COLOR_BODY,
          size: 20,
        }),
      ],
    })
  );
}

// ── Constructores por tipo ────────────────────────────────────────

function buildCourse(doc: ActivityDoc & { kind: "course" }): Paragraph[] {
  const c = doc.activity;
  const out: Paragraph[] = [];

  out.push(h1(c.title || "(Sin título)"));

  // Datos generales
  out.push(...kvGroup([
    ["Tipo", c.typeLabel],
    ["Modalidad", c.modality],
    ["Imparte", c.instructor],
    ["Laboratorio", c.organizingLab],
    ["Correo de contacto", c.contactEmail],
    ["Sesiones", `${c.sessionsCount ?? 0} · ${c.hoursPerSession ?? 0} h por sesión`],
    ["Lugar", c.place],
    ["Serie / ciclo", c.seriesInfo],
    ["Colaboración", c.collaboration],
    ["Asistentes", c.attendees],
  ]));

  out.push(empty());

  // Programa por sesiones
  out.push(h2("Programa por sesiones"));
  for (const s of c.sessions.slice().sort((a, b) => a.index - b.index)) {
    const date = formatDateDMY(s.dateISO) || "(Fecha por definir)";
    const start = formatTimeToH(s.startTime);
    const end = formatTimeToH(s.endTime);
    const time = start && end ? `${start}–${end}` : start || end || "(Horario por definir)";
    const title = s.title?.trim() ? ` — ${s.title.trim()}` : "";
    out.push(bullet(`Sesión ${s.index}: ${date} · ${time} · ${s.durationHours}h${title}`));
  }

  // Secciones de texto largo
  const textSections: [string, string | undefined][] = [
    ["Objetivo", c.objective],
    ["Justificación", c.justification],
    ["Temario", c.syllabus],
    ["Metodología", c.methodology],
    ["Perfil de ingreso", c.entryProfile],
  ];
  for (const [title, text] of textSections) {
    if (text?.trim()) {
      out.push(h2(title));
      out.push(...bodyLines(text));
    }
  }

  // Materiales
  if (c.materials?.trim() || c.materialFee?.trim()) {
    out.push(h2("Materiales"));
    out.push(...bodyLines(c.materials));
    if (c.materialFee?.trim()) out.push(...kvGroup([["Cuota de recuperación", c.materialFee]]));
  }

  // Requerimientos técnicos
  out.push(h2("Requerimientos técnicos"));
  out.push(...kvGroup([
    ["Internet", c.tech.internet],
    ["Montaje", c.tech.setup],
    ["Transmisión", c.tech.broadcast],
    ["Proyección / Audio", c.tech.projectionAudio],
    ["Otros", c.tech.other],
  ]));

  // Difusión
  out.push(h2("Difusión"));
  if (c.promoLines?.trim())              { out.push(body("Líneas fuerza:")); out.push(...bodyLines(c.promoLines)); }
  if (c.audienceResources?.trim())       { out.push(body("Recursos para atención al público:")); out.push(...bodyLines(c.audienceResources)); }
  if (c.keywords?.trim())                  out.push(...kvGroup([["Palabras clave", c.keywords]]));
  if (c.bio?.trim())                     { out.push(body("Semblanza:")); out.push(...bodyLines(c.bio)); }
  if (c.registrationConsiderations?.trim()) { out.push(body("Consideraciones de registro:")); out.push(...bodyLines(c.registrationConsiderations)); }

  return out;
}

function buildArtistic(doc: ActivityDoc & { kind: "artistic" }): Paragraph[] {
  const a = doc.activity;
  const out: Paragraph[] = [];

  out.push(h1(a.title || "(Sin título)"));

  out.push(...kvGroup([
    ["Participantes", a.participants],
    ["Laboratorio", a.organizingLab],
    ["Ciclo", a.cycleName],
    ["Colaboración", a.collaboration],
    ["Modalidad", a.modality],
    ["Lugar", a.place],
    ["Fecha y horarios", a.dateAndTime],
    ["Ensayos", a.rehearsalSchedule],
    ["Montaje", a.setupSchedule],
  ]));

  out.push(empty());

  if (a.description?.trim())    { out.push(h2("Descripción"));    out.push(...bodyLines(a.description)); }
  if (a.particularities?.trim()) { out.push(h2("Particularidades")); out.push(...bodyLines(a.particularities)); }

  out.push(h2("Requerimientos técnicos"));
  out.push(...kvGroup([
    ["Internet", a.tech.internet],
    ["Montaje", a.tech.setup],
    ["Ensayos", a.tech.rehearsal],
    ["Transmisión", a.tech.broadcast],
    ["Proyección / Audio", a.tech.projectionAudio],
    ["Otros", a.tech.other],
  ]));

  out.push(h2("Difusión"));
  if (a.promoLines?.trim())              { out.push(body("Líneas fuerza:")); out.push(...bodyLines(a.promoLines)); }
  if (a.audienceResources?.trim())       { out.push(body("Recursos para atención al público:")); out.push(...bodyLines(a.audienceResources)); }
  if (a.keywords?.trim())                  out.push(...kvGroup([["Palabras clave", a.keywords]]));
  if (a.bio?.trim())                     { out.push(body("Semblanza:")); out.push(...bodyLines(a.bio)); }
  if (a.registrationConsiderations?.trim()) { out.push(body("Consideraciones de registro:")); out.push(...bodyLines(a.registrationConsiderations)); }

  return out;
}

// ── API pública ───────────────────────────────────────────────────

export async function downloadDocx(doc: ActivityDoc) {
  let sectionChildren: Paragraph[];

  if (doc.kind === "course") {
    sectionChildren = buildCourse(doc);
  } else if (doc.kind === "artistic") {
    sectionChildren = buildArtistic(doc);
  } else {
    const p = doc.program;
    sectionChildren = [h1(p.title)];
    for (const s of p.sessions) {
      sectionChildren.push(h2(`Sesión ${s.index}: ${s.title}`));
      sectionChildren.push(...kvGroup([["Fecha", s.dateText], ["Horario", s.timeText]]));
      if (s.learningObjectives?.length) {
        sectionChildren.push(body("Objetivos:"));
        for (const o of s.learningObjectives) sectionChildren.push(bullet(o));
      }
    }
  }

  const wordDoc = new Document({
    creator: "Gestor Centro Multimedia-CENART",
    description: "Ficha de actividad exportada",
    sections: [{ properties: {}, children: sectionChildren }],
  });

  const blob = await Packer.toBlob(wordDoc);
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `Ficha - ${fichaFileName(doc)}.docx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
