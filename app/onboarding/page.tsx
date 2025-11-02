"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../../store/appStore';
import { db } from '../../lib/db';
import NightSky from '../../components/NightSky';
import type { Profile } from '../../lib/types';

export default function OnboardingPage() {
  const [name, setName] = useState('');
  const router = useRouter();
  const { setProfile } = useAppStore();

  return (
    <>
      {/* 星空背景 */}
      <NightSky />
      <div className="mx-auto max-w-md p-6 relative z-10">
      <h1 className="text-xl font-semibold">欢迎使用</h1>
      <p className="mt-2 text-sm text-zinc-400">为这段睡眠记录起个名字吧</p>
      <div className="mt-4 responsive-actions">
        <input
          type="text"
          placeholder="输入你的账号名字"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded bg-black border border-zinc-700 px-3 py-2"
        />
        <button
          className="rounded bg-emerald-600 px-4 py-2"
          onClick={async () => {
            const input = (name || '').trim();
            if (!input) { alert('请输入账户名称'); return; }
            const all = await db.profiles.toArray();
            const exists = all.some((p: Profile) => p.name === input);
            if (exists) { alert('不可创建同名账户'); return; }
            const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
            const now = new Date().toISOString();
            await setProfile({ id, name: input, createdAt: now, updatedAt: now });
            router.push('/');
          }}
        >开始</button>
      </div>
      </div>
    </>
  );
}