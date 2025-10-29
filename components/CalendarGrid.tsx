"use client";
import { useEffect, useMemo, useState } from 'react';
import dayjs from '../lib/dayjs';
import { db } from '../lib/db';
import { useAppStore } from '../store/appStore';
import { groupSessionsByDay, monthDays, calcDayTotals, toHoursString } from '../lib/time';
import { SleepSession } from '../lib/types';
import Link from 'next/link';

export default function CalendarGrid() {
  const { currentProfile, settings } = useAppStore();
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const today = dayjs();
  const year = today.year();
  const monthIndex0 = today.month();

  useEffect(() => {
    if (!currentProfile) return;
    db.sessions
      .where('profileId')
      .equals(currentProfile.id)
      .toArray()
      .then(setSessions);
  }, [currentProfile]);

  const byDay = useMemo(() => groupSessionsByDay(sessions, settings?.dayBoundaryHHmm ?? '02:00'), [sessions, settings]);
  const days = useMemo(() => monthDays(year, monthIndex0), [year, monthIndex0]);

  return (
    <div className="calendar-grid grid grid-cols-7 gap-2">
      {days.map((d) => {
        const list = byDay[d] || [];
        const totals = calcDayTotals(list);
        const goalMinutes = settings ? (typeof settings.sleepGoalMinutes === 'number' ? settings.sleepGoalMinutes : (settings.sleepGoalHours * 60)) : undefined;
        const reached = goalMinutes ? totals.totalMinutes >= goalMinutes : false;
        return (
          <Link key={d} href={`/day/${d}`} className={`calendar-cell rounded-md p-2 border border-zinc-800 hover:border-zinc-600 transition-colors ${reached ? 'bg-emerald-900/30' : 'bg-zinc-900/30'}`}>
            <div className="text-xs text-zinc-400">{dayjs(d).date()}</div>
            {/* 时间显示：固定宽度、单行、省略号，移动端可隐藏单位 */}
            <div className="mt-1 grid-time">
              <span className="grid-time-value">{(totals.totalMinutes / 60).toFixed(1)}</span>
              <span className="grid-time-unit">h</span>
            </div>
            {list.some((s) => s.type === 'nap') && (
              <div className="mt-1 grid-nap text-zinc-400">含小睡</div>
            )}
          </Link>
        );
      })}
    </div>
  );
}