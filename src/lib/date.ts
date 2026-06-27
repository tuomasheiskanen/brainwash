/**
 * Date helpers. Everything is local-time based: a "day" is the user's local
 * calendar day, and ISO keys are YYYY-MM-DD built from local components (never
 * UTC, which would shift the day boundary).
 */

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Local YYYY-MM-DD for a Date. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's local ISO date. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Parse a YYYY-MM-DD key into a local Date at midnight. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Shift an ISO date by a number of days. */
export function addDays(iso: string, delta: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "Tuesday, Jun 24" */
export function formatDayHeader(iso: string): string {
  const d = fromISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "June 2026" */
export function formatMonthTitle(year: number, month0: number): string {
  return `${MONTHS_LONG[month0]} ${year}`;
}

/** "Jun 18–24" style short range. */
export function formatShortRange(startISO: string, endISO: string): string {
  const s = fromISODate(startISO);
  const e = fromISODate(endISO);
  const sm = MONTHS[s.getMonth()];
  const em = MONTHS[e.getMonth()];
  if (sm === em) return `${sm} ${s.getDate()}–${e.getDate()}`;
  return `${sm} ${s.getDate()} – ${em} ${e.getDate()}`;
}

export interface CalendarCell {
  iso: string;
  day: number;
}

/**
 * Build the day cells for a month, with leading blanks so the grid starts on
 * Monday (design uses a Mon–Sun week).
 */
export function monthGrid(
  year: number,
  month0: number
): (CalendarCell | null)[] {
  const first = new Date(year, month0, 1);
  // JS getDay: 0=Sun..6=Sat. We want Monday-first, so Mon=0..Sun=6.
  const leading = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells: (CalendarCell | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toISODate(new Date(year, month0, d)), day: d });
  }
  return cells;
}

/** The Monday→Sunday ISO dates of the week containing `iso`. */
export function weekDates(iso: string): string[] {
  const d = fromISODate(iso);
  const offsetToMonday = (d.getDay() + 6) % 7;
  const monday = addDays(iso, -offsetToMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export const WEEKDAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];
