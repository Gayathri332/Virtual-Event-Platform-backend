import { v4 as uuidv4 } from "uuid";

/**
 * Generates a Google Meet-style link.
 * Format: https://meet.google.com/xxx-xxxx-xxx
 * Since we don't have Google OAuth, we generate a unique meet-style code.
 */
export function generateMeetLink(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";

  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

  // Format: xxx-xxxx-xxx (matches real Google Meet format)
  const code = `${segment(3)}-${segment(4)}-${segment(3)}`;
  return `https://meet.google.com/${code}`;
}

/**
 * Converts "YYYY-MM-DD" + "HH:MM" to a JS Date object
 */
export function toDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

/**
 * Formats a Date to ICS datetime string "YYYYMMDDTHHmmss"
 */
export function toIcsDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}
