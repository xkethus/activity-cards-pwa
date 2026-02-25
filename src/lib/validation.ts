import type { ActivityDoc } from "./types";

function isBlank(x: string | undefined | null) {
  return !x || !String(x).trim();
}

// Returns a list of missing required fields (human labels) for submitting to validation.
export function validateForSubmission(doc: ActivityDoc): string[] {
  const missing: string[] = [];

  if (doc.kind === "course") {
    const c = doc.activity;
    if (isBlank(c.title)) missing.push("Título");
    if (isBlank(c.typeLabel)) missing.push("Tipo (curso/taller/seminario)");
    if (isBlank(c.instructor)) missing.push("Persona que imparte");
    if (isBlank(c.organizingLab)) missing.push("Laboratorio que organiza");
    if (isBlank(c.contactEmail)) missing.push("Correo de contacto");

    if (!c.sessionsCount || c.sessionsCount < 1) missing.push("Número de sesiones");
    if (!c.hoursPerSession || c.hoursPerSession < 1) missing.push("Horas por sesión");

    if (isBlank(c.dateAndTime)) missing.push("Fecha y horarios (texto general)");
    if (isBlank(c.place)) missing.push("Lugar");
    if (isBlank(c.modality)) missing.push("Modalidad");

    if (isBlank(c.objective)) missing.push("Objetivo");
    if (isBlank(c.justification)) missing.push("Justificación");
    if (isBlank(c.syllabus)) missing.push("Temario");
    if (isBlank(c.entryProfile)) missing.push("Perfil de ingreso");
    if (isBlank(c.attendees)) missing.push("Número de asistentes");
    if (isBlank(c.materials)) missing.push("Materiales solicitados");

    if (isBlank(c.bio)) missing.push("Semblanza");
    if (isBlank(c.registrationConsiderations)) missing.push("Consideraciones extra (registro)");

    return missing;
  }

  if (doc.kind === "artistic") {
    const a = doc.activity;
    if (isBlank(a.title)) missing.push("Título");
    if (isBlank(a.participants)) missing.push("Participantes");
    if (isBlank(a.organizingLab)) missing.push("Laboratorio que organiza");
    if (isBlank(a.cycleName)) missing.push("Nombre del ciclo");
    if (isBlank(a.collaboration)) missing.push("Actividad en colaboración");
    if (isBlank(a.description)) missing.push("Descripción");
    if (isBlank(a.modality)) missing.push("Modalidad");

    if (isBlank(a.dateAndTime)) missing.push("Fecha y horarios");
    if (isBlank(a.rehearsalSchedule)) missing.push("Ensayos (fecha y horarios)");
    if (isBlank(a.setupSchedule)) missing.push("Montaje (fecha y horarios)");
    if (isBlank(a.place)) missing.push("Lugar");

    if (isBlank(a.bio)) missing.push("Semblanza");

    return missing;
  }

  // legacy sessions: no se valida aquí
  return missing;
}

export function isReadyForSubmission(doc: ActivityDoc): boolean {
  return validateForSubmission(doc).length === 0;
}
