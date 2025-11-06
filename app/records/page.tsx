"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dayjs from '@/lib/dayjs';
import { useAppStore } from '@/store/appStore';
import { useNavigationStore } from '@/store/navigationStore';
import CalendarGrid from '@/components/CalendarGrid';
import SleepStartEndButton from '@/components/SleepStartEndButton';
import BackButton from '@/components/BackButton';
import ManualAddModal from '@/components/ManualAddModal';
import dynamic from 'next/dynamic';
const NightSky = dynamic(() => import('@/components/NightSky'), { ssr: false });

export default function RecordsPage() {
  const router = useRouter();
  const { currentProfile, settings, loadInitial } = useAppStore();
  const { pushRoute } = useNavigationStore();
  const [showManualAddModal, setShowManualAddModal] = useState(false);

  useEffect(() => {
    pushRoute('/records');
    if (!useAppStore.getState().currentProfile) {
      loadInitial().then(() => {
        if (!useAppStore.getState().currentProfile) {
          router.replace('/');
        }
      });
    }
  }, [loadInitial, router, pushRoute]);

  const today = dayjs().format('YYYY-MM-DD');

  if (!currentProfile) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <p className="text-zinc-400">请先选择账户</p>
        <Link href="/" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
          返回账户选择
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* 夜空背景（深色基调，星空与月亮），不阻挡交互 */}
      <NightSky variant="records" />
      <div className="mx-auto max-w-3xl p-6 relative z-10">
      {/* 固定右上角返回按钮，考虑全面屏安全区与响应式边距 */}
      <div className="safe-fixed-top-right z-50"><BackButton /></div>
      <header className="flex flex-col gap-2">
        <div className="text-xl font-semibold whitespace-nowrap">睡眠记录</div>
        <div className="text-sm text-zinc-400 whitespace-nowrap">账号：{currentProfile.name}</div>
      </header>

      {/* 按钮行整体右对齐，带安全边距与响应式间距 */}
      <nav className="mt-3 responsive-actions text-sm">
        <Link href={`/day/${today}`} className="responsive-btn-text rounded border border-zinc-700 px-3 py-1">今日明细</Link>
        <button 
          onClick={() => setShowManualAddModal(true)}
          className="responsive-btn-text rounded border border-zinc-700 px-3 py-1"
        >
          手动添加
        </button>
        <Link href="/settings" className="responsive-btn-text rounded border border-zinc-700 px-3 py-1">设置</Link>
        {/* 已移除清空全部记录功能 */}
      </nav>

      <section className="mt-6">
        {(() => {
          const goalMinutes = settings ? (typeof settings.sleepGoalMinutes === 'number' ? settings.sleepGoalMinutes : (settings.sleepGoalHours * 60)) : 8 * 60;
          const monthLabel = dayjs().format('YYYY年MM月');
          return (
            <div className="mb-3 text-sm text-zinc-400">本月目标（{monthLabel}）：<span className="text-zinc-100">{(goalMinutes/60).toFixed(1)} 小时/日</span></div>
          );
        })()}
        <CalendarGrid />
      </section>

      <SleepStartEndButton />

      <ManualAddModal
        open={showManualAddModal}
        onClose={() => setShowManualAddModal(false)}
        onSuccess={() => {
          // 刷新日历网格以显示新添加的记录
          window.location.reload();
        }}
      />
      </div>
    </>
  );
}