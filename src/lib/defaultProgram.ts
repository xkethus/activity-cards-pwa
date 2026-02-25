import type { Program } from "./types";

export const defaultProgram: Program = {
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
