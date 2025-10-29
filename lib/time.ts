import dayjs from './dayjs';
import { SleepSession } from './types';

export function minutesBetween(startISO: string, endISO: string): number {
  const start = dayjs(startISO);
  const end = dayjs(endISO);
  return Math.max(0, Math.round(end.diff(start, 'minute', true)));
}

export function toHoursString(totalMinutes: number): string {
  const hours = (totalMinutes / 60);
  return `${hours.toFixed(1)}小时`;
}

// 将分钟数转为“X小时Y分钟”文本（分钟四舍五入）
export function toHoursMinutesString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return `${h}小时${m}分钟`;
}

export function sessionScore(mins: number, rating: number): number {
  return (mins / 60) * rating;
}

export function dateKeyFromISO(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD');
}

export function attributedDateFromStartISO(startISO: string, boundaryHHmm: string = '02:00'): string {
  const t = dayjs(startISO);
  const [bhStr, bmStr] = boundaryHHmm.split(':');
  const bh = Number(bhStr);
  const bm = Number(bmStr);
  const isBeforeBoundary = t.hour() < bh || (t.hour() === bh && t.minute() < bm);
  return isBeforeBoundary ? t.subtract(1, 'day').format('YYYY-MM-DD') : t.format('YYYY-MM-DD');
}

export function groupSessionsByDay(sessions: SleepSession[], boundaryHHmm: string = '02:00'): Record<string, SleepSession[]> {
  const map: Record<string, SleepSession[]> = {};
  for (const s of sessions) {
    const key = attributedDateFromStartISO(s.start, boundaryHHmm);
    (map[key] ||= []).push(s);
  }
  return map;
}

export function calcDayTotals(sessions: SleepSession[]) {
  const totalMinutes = sessions.reduce((acc, s) => acc + minutesBetween(s.start, s.end), 0);
  const score = sessions.reduce((acc, s) => acc + sessionScore(minutesBetween(s.start, s.end), s.rating ?? 0), 0);
  return { totalMinutes, score };
}

export function monthDays(year: number, monthIndex0: number): string[] {
  const start = dayjs().year(year).month(monthIndex0).date(1);
  const days = start.daysInMonth();
  const arr: string[] = [];
  for (let i = 1; i <= days; i++) {
    arr.push(start.date(i).format('YYYY-MM-DD'));
  }
  return arr;
}