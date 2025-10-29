'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import dayjs from '@/lib/dayjs';

export default function SleepStartEndButton() {
  const router = useRouter();
  const { currentProfile, active, startSleep } = useAppStore();
  const [showChooser, setShowChooser] = useState(false);

  if (!currentProfile) {
    return (
      <div className="p-4 responsive-actions">
        <button className="btn" onClick={() => router.push('/onboarding')}>去设置账号名</button>
      </div>
    );
  }

  // 未进行中：显示开始按钮与模式选择
  if (!active) {
    return (
      <div className="p-4">
        <div className="responsive-actions">
          <button className="btn btn-primary" onClick={() => setShowChooser(true)}>开始睡眠</button>
        </div>
        {showChooser && (
          <div className="mt-4 responsive-actions">
            <button className="btn" onClick={async () => { await startSleep('nap'); setShowChooser(false); router.push('/sleep'); }}>小睡</button>
            <button className="btn" onClick={async () => { await startSleep('main'); setShowChooser(false); router.push('/sleep'); }}>主睡眠</button>
            <button className="btn" onClick={() => setShowChooser(false)}>取消</button>
          </div>
        )}
      </div>
    );
  }

  // 进行中：仅提示进行中并进入专用页面
  return (
    <div className="p-4 space-y-3">
      <div className="text-right">进行中：{active.type === 'main' ? '主睡眠' : '小睡'}，开始于 {dayjs(active.start).format('HH:mm')}</div>
      <div className="responsive-actions">
        <button className="btn btn-primary" onClick={() => router.push('/sleep')}>打开睡眠页面</button>
      </div>
    </div>
  );
}