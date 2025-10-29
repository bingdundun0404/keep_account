"use client";
import { useEffect, useMemo, useState } from 'react';
import dayjs from '../../lib/dayjs';
import Link from 'next/link';
import { db } from '../../lib/db';
import { useAppStore } from '../../store/appStore';
import { useNavigationStore } from '../../store/navigationStore';
import BackButton from '../../components/BackButton';
import { SleepSession } from '../../lib/types';
import { calcDayTotals, attributedDateFromStartISO, minutesBetween, sessionScore } from '../../lib/time';

function sumSessions(sessions: SleepSession[]) {
  const totals = sessions.reduce((acc, s) => {
    const mins = minutesBetween(s.start, s.end);
    acc.minutes += mins;
    acc.score += sessionScore(mins, s.rating ?? 0);
    return acc;
  }, { minutes: 0, score: 0 });
  return totals;
}

export default function ReportsPage() {
  const { currentProfile, settings } = useAppStore();
  const { pushRoute } = useNavigationStore();
  const [allSessions, setAllSessions] = useState<SleepSession[]>([]);

  useEffect(() => {
    pushRoute('/reports');
  }, [pushRoute]);

  useEffect(() => {
    if (!currentProfile) return;
    db.sessions.where('profileId').equals(currentProfile.id).toArray().then(setAllSessions);
  }, [currentProfile]);

  const boundary = settings?.dayBoundaryHHmm ?? '02:00';

  const weekDays = useMemo(() => {
    const m = dayjs().startOf('week').subtract(7, 'day').add(1, 'day');
    return Array.from({ length: 7 }).map((_, i) => m.add(i, 'day'));
  }, []);

  const weekDetail = useMemo(() => {
    const goalMinutes = settings ? (typeof settings.sleepGoalMinutes === 'number' ? settings.sleepGoalMinutes : (settings.sleepGoalHours * 60)) : 8 * 60;
    return weekDays.map((d) => {
      const dateKey = d.format('YYYY-MM-DD');
      const ds = allSessions.filter((s) => attributedDateFromStartISO(s.start, boundary) === dateKey);
      const t = calcDayTotals(ds);
      const reached = t.totalMinutes >= goalMinutes;
      return { date: dateKey, minutes: t.totalMinutes, score: t.score, reached };
    });
  }, [weekDays, allSessions, settings, boundary]);

  const weekTotal = useMemo(() => {
    const monday = dayjs().startOf('week').subtract(7, 'day').add(1, 'day');
    const sunday = monday.add(6, 'day').endOf('day');
    const ds = allSessions.filter((s) => {
      const dkey = attributedDateFromStartISO(s.start, boundary);
      const d = dayjs(dkey);
      return d.isAfter(monday.subtract(1, 'minute')) && d.isBefore(sunday.add(1, 'minute'));
    });
    return sumSessions(ds);
  }, [allSessions, boundary]);

  const monthTotal = useMemo(() => {
    const mStart = dayjs().startOf('month');
    const mEnd = dayjs().endOf('month');
    const ds = allSessions.filter((s) => {
      const dkey = attributedDateFromStartISO(s.start, boundary);
      const d = dayjs(dkey);
      return d.isAfter(mStart.subtract(1, 'minute')) && d.isBefore(mEnd.add(1, 'minute'));
    });
    return sumSessions(ds);
  }, [allSessions, boundary]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* 固定右上角返回按钮，考虑全面屏安全区与响应式边距 */}
      <div className="safe-fixed-top-right z-50"><BackButton /></div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">报表</h1>
      </div>
      <section className="mt-4">
        <h2 className="text-lg font-medium">上周记录</h2>
        <div className="mt-2 text-sm text-zinc-400">总时长：{(weekTotal.minutes / 60).toFixed(1)}小时 · 周得分：{weekTotal.score.toFixed(1)}</div>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {weekDetail.map((d) => (
            <div key={d.date} className="flex justify-between rounded border border-zinc-800 p-2">
              <div className="text-sm">{d.date}</div>
              <div className="text-sm">{(d.minutes / 60).toFixed(1)}小时 · 分 {d.score.toFixed(1)} · {d.reached ? '达标' : '未达标'}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-6">
        <h2 className="text-lg font-medium">本月</h2>
        <div className="mt-2 text-sm text-zinc-400">总时长：{(monthTotal.minutes / 60).toFixed(1)}小时 · 月得分：{monthTotal.score.toFixed(1)}</div>
      </section>
    </div>
  );
}