import { formatLocalDate } from '@/components/molecules';

/** Default time shown when opening the form (+35 min). */
export const DEFAULT_LEAD_MS = 35 * 60 * 1000;
/** Minimum allowed at submit (+30 min) when scheduling for today. */
export const VALIDATION_LEAD_MS = 30 * 60 * 1000;
/** Urgent hire service date cannot be more than this many calendar days ahead. */
export const MAX_URGENT_SCHEDULE_DAYS = 2;

export function startOfToday(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function maxPreferredDate(from: Date = new Date()): Date {
  const d = startOfToday(from);
  d.setDate(d.getDate() + MAX_URGENT_SCHEDULE_DAYS);
  return d;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return formatLocalDate(a) === formatLocalDate(b);
}

export function isDateWithinUrgentWindow(date: Date, now: Date = new Date()): boolean {
  const day = startOfToday(date).getTime();
  const min = startOfToday(now).getTime();
  const max = maxPreferredDate(now).getTime();
  return day >= min && day <= max;
}

export function defaultPreferredTime(from: Date = new Date()): string {
  const t = new Date(from.getTime() + DEFAULT_LEAD_MS);
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
}

export function minimumPreferredTime(from: Date = new Date()): string {
  const min = new Date(from.getTime() + VALIDATION_LEAD_MS);
  return `${String(min.getHours()).padStart(2, '0')}:${String(min.getMinutes()).padStart(2, '0')}`;
}

export function parseTimeHm(value: string): { h: number; m: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

function toMinutes(h: number, m: number): number {
  return h * 60 + m;
}

export function isValidPreferredSchedule(date: Date, timeStr: string, now: Date = new Date()): boolean {
  if (!isDateWithinUrgentWindow(date, now)) return false;
  const parsed = parseTimeHm(timeStr);
  if (!parsed) return false;
  if (!isSameLocalDay(date, now)) return true;
  const min = parseTimeHm(minimumPreferredTime(now));
  if (!min) return false;
  return toMinutes(parsed.h, parsed.m) >= toMinutes(min.h, min.m);
}

export function clampPreferredTime(date: Date, timeStr: string, now: Date = new Date()): string {
  if (!isDateWithinUrgentWindow(date, now)) {
    return minimumPreferredTime(now);
  }
  const minStr = isSameLocalDay(date, now) ? minimumPreferredTime(now) : '09:00';
  const parsed = parseTimeHm(timeStr);
  if (!parsed) return minStr;
  const min = parseTimeHm(minStr)!;
  if (toMinutes(parsed.h, parsed.m) < toMinutes(min.h, min.m)) return minStr;
  return `${String(parsed.h).padStart(2, '0')}:${String(parsed.m).padStart(2, '0')}`;
}

export function formatTimeHm(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
