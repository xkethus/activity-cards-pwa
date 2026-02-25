export type Program = {
  title: string;
  subtitle?: string;
  description: string;
  metrics: {
    sessions: number;
    hoursPerSession: number;
    totalHours: number;
  };
  sessions: Session[];
};

export type SessionAgendaItem = {
  time: string; // e.g. "16:00 - 16:45"
  title: string;
  durationMin: number;
  notes?: string;
};

export type Session = {
  index: number; // 1..N
  title: string;
  dateText: string;
  timeText: string;
  learningObjectives: string[];
  agenda: SessionAgendaItem[];
  materials: string[];
};

// --- Activity templates (from docs/*.docx) ---

export type ActivityType = "sessions" | "artistic" | "course";

export type ArtisticActivity = {
  title: string;
  participants: string;
  organizingLab: string;
  cycleName: string;
  collaboration: string;
  description: string;
  modality: "Presencial" | "En línea" | "Híbrida" | "";
  dateAndTime: string;
  rehearsalSchedule: string; // default N/A
  setupSchedule: string; // default N/A
  place: string;
  particularities: string; // default N/A
  registrationConsiderations: string; // default N/A
  bio: string; // default N/A
  promoLines: string;
  audienceResources: string;
  keywords: string;
  tech: {
    internet: string;
    setup: string;
    rehearsal: string;
    broadcast: string;
    projectionAudio: string;
    other: string;
  };
  // Extra/internal fields (not shown in the public card unless you want)
  internalNotes?: string;
};

export type CourseActivity = {
  title: string;
  typeLabel: "Curso" | "Taller" | "Seminario" | "";
  instructor: string;
  organizingLab: string;
  contactEmail: string;
  durationHours: number;
  dateAndTime: string;
  place: string;
  seriesInfo: string;
  collaboration: string;
  modality: "Presencial" | "En línea" | "Híbrida" | "";
  objective: string;
  justification: string;
  syllabus: string;
  methodology: string;
  entryProfile: string;
  attendees: string;
  materials: string;
  materialFee: string;
  evaluation: {
    attendance: string;
    participation: string;
    cameraOn: string;
    other: string;
  };
  promoLines: string;
  audienceResources: string;
  keywords: string;
  bio: string;
  registrationConsiderations: string;
  tech: {
    internet: string;
    setup: string;
    broadcast: string;
    projectionAudio: string;
    other: string;
  };
  internalNotes?: string;
};

export type ActivityDoc =
  | { kind: "sessions"; program: Program }
  | { kind: "artistic"; activity: ArtisticActivity }
  | { kind: "course"; activity: CourseActivity };
