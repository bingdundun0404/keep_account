"use client";
import dayjs from "../../../lib/dayjs";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../lib/db";
import { useAppStore } from "../../../store/appStore";
import { useNavigationStore } from "../../../store/navigationStore";
import BackButton from "../../../components/BackButton";
import NightSky from "../../../components/NightSky";
import { SleepSession } from "../../../lib/types";
import {
  calcDayTotals,
  toHoursString,
  attributedDateFromStartISO,
  minutesBetween,
  toHoursMinutesString,
} from "../../../lib/time";
import ConfirmDialog from "../../../components/ConfirmDialog";

export default function DayDetailClient() {
  const params = useParams<{ date: string }>();
  const date = params?.date as string;
  const { currentProfile, settings, loadInitial } = useAppStore();
  const { pushRoute } = useNavigationStore();
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);

  // 使用传入的路由日期进行展示与数据筛选；“今日明细”入口应通过链接传入当天日期

  useEffect(() => {
    pushRoute(`/day/${date}`);
    if (!currentProfile) {
      loadInitial();
      return;
    }
    db.sessions
      .where("profileId")
      .equals(currentProfile.id)
      .toArray()
      .then((all: SleepSession[]) => {
        const boundary = settings?.dayBoundaryHHmm ?? "02:00";
        const filtered = all.filter(
          (s: SleepSession) => attributedDateFromStartISO(s.start, boundary) === date
        );
        setSessions(filtered);
      });
  }, [currentProfile, date, loadInitial, pushRoute, settings]);

  const totals = useMemo(() => calcDayTotals(sessions), [sessions]);
  const goalMinutes = settings
    ? typeof settings.sleepGoalMinutes === "number"
      ? settings.sleepGoalMinutes
      : settings.sleepGoalHours * 60
    : undefined;
  const reached = goalMinutes ? totals.totalMinutes >= goalMinutes : false;

  const refreshList = async () => {
    if (!currentProfile) return;
    const all: SleepSession[] = await db.sessions
      .where("profileId")
      .equals(currentProfile.id)
      .toArray();
    const boundary = settings?.dayBoundaryHHmm ?? "02:00";
    const refreshed = all.filter(
      (x: SleepSession) => attributedDateFromStartISO(x.start, boundary) === date
    );
    setSessions(refreshed);
  };

  return (
    <>
      {/* 星空背景 */}
      <NightSky />
      <div className="mx-auto max-w-3xl p-6 relative z-10">
      <div className="safe-fixed-top-right z-50">
        <BackButton />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">睡眠明细</h1>
          <div className="mt-1 text-zinc-400 text-sm md:text-base">
            {/* 使用正则直接渲染中文日期，避免 dayjs(undefined) 回退到今天 */}
            {(() => {
              const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(date || "");
              return m ? `${m[1]}年${m[2]}月${m[3]}日` : (date || dayjs().format("YYYY年MM月DD日"));
            })()}
          </div>
        </div>
        <div className="flex items-center gap-3"></div>
      </div>
      <div className="mt-3 text-sm text-zinc-300">
        <div>
          总时长：
          <span className="font-semibold text-zinc-100">
            {toHoursString(totals.totalMinutes)}（
            {toHoursMinutesString(totals.totalMinutes)}）
          </span>
        </div>
        <div className="mt-1">
          当日得分：
          <span className="font-semibold text-emerald-300">
            {totals.score.toFixed(1)}
          </span>{" "}
          · {reached ? "达标" : "未达标"}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {sessions.map((s) => (
          <div key={s.id} className="rounded-md border border-zinc-800 p-3">
            <div className="flex justify-between items-center">
              <div className="text-xs text-zinc-400">
                {s.type === "main" ? "主睡眠" : "小睡"}
              </div>
              <button
                className="text-xs text-red-400 hover:text-red-300"
                onClick={() => {
                  setTargetSessionId(s.id);
                  setConfirmOpen(true);
                }}
              >
                删除
              </button>
            </div>
            <div className="text-sm">
              <div>
                {dayjs(s.start).format("MM-DD HH:mm")} — {dayjs(s.end).format("MM-DD HH:mm")}
              </div>
              <div className="mt-1">
                <span className="font-semibold text-zinc-100">
                  {toHoursString(minutesBetween(s.start, s.end))}（
                  {toHoursMinutesString(minutesBetween(s.start, s.end))}）
                </span>
                <span>
                  {" "}· 评分 <span className="font-semibold text-amber-300">{s.rating}</span>
                </span>
              </div>
            </div>
            {s.note && <div className="text-xs text-zinc-500">备注：{s.note}</div>}
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-sm text-zinc-400">暂无记录</div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="确认删除睡眠记录"
        description="删除后不可恢复。请确认是否继续。"
        confirmText="确认删除"
        cancelText="取消"
        onConfirm={async () => {
          if (!targetSessionId) return;
          await useAppStore.getState().deleteSession(targetSessionId);
          setConfirmOpen(false);
          setTargetSessionId(null);
          await refreshList();
        }}
        onCancel={() => {
          setConfirmOpen(false);
          setTargetSessionId(null);
        }}
      />
      </div>
    </>
  );
}