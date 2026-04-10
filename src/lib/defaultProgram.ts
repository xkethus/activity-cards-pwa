import type { ActivityDoc, ArtisticActivity, CourseActivity, Program } from "./types";
import { makeLiteSessions } from "./courseSessions";

export const defaultSessionsProgram: Program = {
  title: "Taller de Electrónica, Electricidad y Sensores para Danza",
  subtitle: "Programa Académico",
  description:
    "Un programa intensivo para explorar la intersección entre tecnología y movimiento. Cada sesión dura 3 horas con teoría, práctica y experimentación creativa.",
  metrics: {
    sessions: 8,
    hoursPerSession: 3,
    totalHours: 24,
  },
  sessions: [
    {
      index: 1,
      title: "Introducción a la Electricidad y Circuitos Básicos",
      dateText: "Lunes, 25 de Noviembre 2025",
      timeText: "16:00 - 19:00",
      learningObjectives: [
        "Comprender conceptos básicos de electricidad",
        "Identificar componentes electrónicos fundamentales",
        "Construir circuitos simples",
      ],
      agenda: [
        {
          time: "16:00 - 16:45",
          title: "Teoría Eléctrica Básica",
          durationMin: 45,
          notes: "Voltaje, corriente, resistencia. Ley de Ohm. Seguridad eléctrica.",
        },
        {
          time: "16:45 - 17:45",
          title: "Componentes y Protoboard",
          durationMin: 60,
          notes: "LEDs, resistencias, interruptores. Práctica con protoboard.",
        },
        { time: "17:45 - 18:00", title: "Descanso", durationMin: 15, notes: "Pausa" },
        {
          time: "18:00 - 19:00",
          title: "Primer Circuito",
          durationMin: 60,
          notes: "Construcción de circuito LED. Troubleshooting.",
        },
      ],
      materials: ["Kit de componentes básicos", "Protoboard", "Multímetro", "Baterías 9V"],
    },
  ],
};

export const defaultArtisticActivity: ArtisticActivity = {
  title: "",
  participants: "",
  organizingLab: "",
  cycleName: "",
  collaboration: "",
  description: "",
  modality: "",
  dateAndTime: "",
  rehearsalSchedule: "N/A",
  setupSchedule: "N/A",
  place: "",
  particularities: "N/A",
  registrationConsiderations: "N/A",
  bio: "N/A",
  promoLines: "",
  audienceResources: "",
  keywords: "",
  tech: {
    internet: "N/A",
    setup: "N/A",
    rehearsal: "N/A",
    broadcast: "",
    projectionAudio: "N/A",
    other: "",
  },
  internalNotes: "",
};

export const defaultCourseActivity: CourseActivity = {
  title: "",
  typeLabel: "",
  instructor: "",
  organizingLab: "",
  contactEmail: "",

  sessionsCount: 8,
  hoursPerSession: 3,
  sessions: makeLiteSessions(8, 3),
  scheduleMode: "SAME" as const,

  dateAndTime: "",
  place: "",
  seriesInfo: "",
  collaboration: "",
  modality: "",
  objective: "",
  justification: "",
  syllabus: "",
  methodology: "",
  entryProfile: "",
  attendees: "",
  materials: "",
  materialFee: "",
  evaluation: {
    attendance: "",
    participation: "",
    cameraOn: "",
    other: "",
  },
  promoLines: "",
  audienceResources: "",
  keywords: "",
  bio: "",
  registrationConsiderations: "",
  tech: {
    internet: "",
    setup: "",
    broadcast: "",
    projectionAudio: "",
    other: "",
  },
  internalNotes: "",
};

export const defaultDoc: ActivityDoc = {
  kind: "course",
  activity: defaultCourseActivity,
};
