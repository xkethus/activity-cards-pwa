import type { SessionLite } from "./types";

export function makeLiteSessions(n: number, hoursPerSession: number): SessionLite[] {
  const out: SessionLite[] = [];
  for (let i = 1; i <= n; i++) {
    out.push({
      index: i,
      title: "",
      dateText: "",
      timeText: "",
      durationHours: hoursPerSession,
    });
  }
  return out;
}

export function normalizeLiteSessions(
  sessions: SessionLite[],
  sessionsCount: number,
  hoursPerSession: number
): SessionLite[] {
  const existing = new Map(sessions.map((s) => [s.index, s] as const));
  const next: SessionLite[] = [];
  for (let i = 1; i <= sessionsCount; i++) {
    const prev = existing.get(i);
    next.push(
      prev ?? {
        index: i,
        title: "",
        dateText: "",
        timeText: "",
        durationHours: hoursPerSession,
      }
    );
  }
  return next;
}
