/**
 * Converts a JS Date + optional time string ("HH:mm") to a LocalDateTime string
 * in the format the Spring backend expects: "YYYY-MM-DDTHH:mm:ss" (no timezone).
 */
export function toLocalDateTimeString(date: Date, time?: string): string {
  const d = new Date(date);
  if (time) {
    const [h, m] = time.split(':').map(Number);
    d.setHours(h, m, 0, 0);
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
  );
}

/**
 * Parses a LocalDateTime string ("YYYY-MM-DDTHH:mm:ss") into a JS Date.
 * Avoids the UTC shift that new Date("...T...") without Z produces in some envs.
 */
export function fromLocalDateTimeString(s: string): Date {
  const [datePart, timePart] = s.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = (timePart ?? '00:00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds ?? 0);
}

/** Extracts "HH:mm" from a LocalDateTime string. */
export function extractTime(s: string): string {
  const timePart = s.split('T')[1] ?? '00:00:00';
  return timePart.substring(0, 5);
}

/** Returns true when a LocalDateTime string is in the future. */
export function isFuture(s: string): boolean {
  return fromLocalDateTimeString(s) > new Date();
}

/** Returns today's date at midnight as a JS Date (for datepicker min). */
export function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
