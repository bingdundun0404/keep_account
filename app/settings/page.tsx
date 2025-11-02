"use client";
import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { db } from '../../lib/db';
import { useNavigationStore } from '../../store/navigationStore';
import BackButton from '../../components/BackButton';
import NightSky from '../../components/NightSky';
import { useMemo } from 'react';
import { minutesBetween } from '../../lib/time';

export default function SettingsPage() {
  const { currentProfile, settings } = useAppStore();
  const { pushRoute } = useNavigationStore();
  // 以分钟为单位的目标：范围 240-720，步进 1 分钟
  const initialGoalMinutes = useMemo(() => {
    if (!settings) return 8 * 60;
    if (typeof settings.sleepGoalMinutes === 'number') return settings.sleepGoalMinutes;
    return (settings.sleepGoalHours ?? 8) * 60;
  }, [settings]);
  const [goalMinutes, setGoalMinutes] = useState<number>(initialGoalMinutes);
  const [boundary, setBoundary] = useState<string>(settings?.dayBoundaryHHmm ?? '02:00');

  useEffect(() => {
    pushRoute('/settings');
  }, [pushRoute]);



  useEffect(() => {
    if (settings) {
      const gm = typeof settings.sleepGoalMinutes === 'number' ? settings.sleepGoalMinutes : (settings.sleepGoalHours * 60);
      setGoalMinutes(gm);
      setBoundary(settings.dayBoundaryHHmm ?? '02:00');
    }
  }, [settings]);

  return (
    <>
      {/* 星空背景 */}
      <NightSky />
      <div className="mx-auto max-w-3xl p-6 relative z-10">
      {/* 固定右上角返回按钮，考虑全面屏安全区与响应式边距 */}
      <div className="safe-fixed-top-right z-50"><BackButton /></div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">设置</h1>
      </div>
      <div className="mt-6 space-y-4">
        <div>
          <div className="flex items-center">
            <label className="text-sm text-zinc-400">目标睡眠时长</label>
            <input
              type="time"
              min="00:00"
              max="23:59"
              step="60"
              className="ml-2 w-32 rounded border border-zinc-700 bg-transparent px-2 py-1"
              value={(() => {
                const h = String(Math.floor(goalMinutes / 60)).padStart(2, '0');
                const m = String(goalMinutes % 60).padStart(2, '0');
                return `${h}:${m}`;
              })()}
              onChange={(e) => {
                const val = e.target.value || '08:00';
                const [hh, mm] = val.split(':');
                const mins = Math.max(0, Math.min(23, Number(hh))) * 60 + Math.max(0, Math.min(59, Number(mm)));
                setGoalMinutes(mins);
              }}
              aria-label="目标睡眠时长"
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">范围：0-23小时，0-59分钟；默认 08:00（8小时0分钟）。</p>
          <div className="mt-2 text-sm">当前：{Math.floor(goalMinutes / 60)} 小时 {goalMinutes % 60} 分钟</div>
        </div>
        <div>
          <label className="text-sm text-zinc-400">时间归属分界点 </label>
          <input
            type="time"
            className="mt-1 w-32 rounded border border-zinc-700 bg-transparent px-2 py-1"
            value={boundary}
            onChange={(e) => setBoundary(e.target.value)}
          />
          <p className="mt-1 text-xs text-zinc-500">示例：02:00 表示凌晨两点前开始的睡眠归属于前一日。</p>
        </div>
        <div className="mt-2 responsive-actions">
          <button className="responsive-btn-text rounded border border-zinc-700 px-3 py-1" onClick={() => {
            // 保存用户最后选择的目标睡眠时长（分钟），默认 8 小时 0 分钟
            const finalMinutes = (typeof goalMinutes === 'number' && goalMinutes >= 0) ? goalMinutes : (8 * 60);
            useAppStore.getState().updateSettings({ sleepGoalMinutes: finalMinutes, dayBoundaryHHmm: boundary });
            alert('已保存');
          }}>保存</button>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-medium">数据导出/导入（导入将覆盖）</h2>
        <div className="mt-3 responsive-actions">
          <button
            className="responsive-btn-text rounded border border-zinc-700 px-4 py-2 text-sm"
            onClick={async () => {
              if (!currentProfile) { alert('请先设置账号'); return; }
              const sessions = await db.sessions.where('profileId').equals(currentProfile.id).toArray();
              const settings = await db.settings.get({ profileId: currentProfile.id });
              const payload = { profile: currentProfile, settings, sessions };
              const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `sleep_backup_${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >导出 JSON</button>
          <label className="responsive-btn-text rounded border border-zinc-700 px-4 py-2 text-sm cursor-pointer">
            导入 JSON（覆盖）
            <input type="file" accept="application/json" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              try {
                const data = JSON.parse(text);
                if (!data.profile || !data.sessions) throw new Error('结构不正确');
                // overwrite
                await db.transaction('rw', db.profiles, db.settings, db.sessions, async () => {
                  await db.sessions.where('profileId').equals(data.profile.id).delete();
                  await db.profiles.put(data.profile);
                  if (data.settings) await db.settings.put(data.settings);
                  for (const s of data.sessions) {
                    // 统一以分钟存储时长：如果缺失则补写
                    const durationMinutes = (typeof s.durationMinutes === 'number') ? s.durationMinutes : minutesBetween(s.start, s.end);
                    await db.sessions.put({ ...s, durationMinutes });
                  }
                });
                alert('导入完成（已覆盖）');
              } catch (err) {
                alert('导入失败：' + (err as Error).message);
              }
            }} />
          </label>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-medium">隐私声明</h2>
        <p className="mt-2 text-sm text-zinc-400">本应用不收集、不上传任何个人数据，所有记录仅保存在你的设备本地（IndexedDB）。导入备份将覆盖现有数据。</p>
      </section>
      </div>
    </>
  );
}