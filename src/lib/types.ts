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
