"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from '@/lib/dayjs';
import { useAppStore } from '@/store/appStore';
import { useNavigationStore } from '@/store/navigationStore';
import dynamic from 'next/dynamic';
const NightSky = dynamic(() => import('@/components/NightSky'), { ssr: false });

export default function SleepPage() {
  const router = useRouter();
  const { pushRoute } = useNavigationStore();
  const { currentProfile, active } = useAppStore();
  const [phase, setPhase] = useState<'running' | 'rating'>('running');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [note, setNote] = useState<string>('');
  const [ratingConfirmed, setRatingConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const noteLimit = 140;
  const quickNotes = useMemo(() => [
    '醒来精神好', '醒来一般', '困倦', '做梦', '多次醒来', '被打断', '心情平稳', '心情低落'
  ], []);
  const startTimeHHmm = active ? dayjs(active.start).format('HH:mm') : '';

  const draftKey = useMemo(() => currentProfile ? `sleep_draft_${currentProfile.id}` : 'sleep_draft', [currentProfile]);

  function hapticPulse(ms = 10) {
    try { if (navigator?.vibrate) navigator.vibrate(ms); } catch {}
  }

  useEffect(() => {
    pushRoute('/sleep');
  }, [pushRoute]);

  useEffect(() => {
    if (!currentProfile) {
      // 无账户，返回账户选择
      router.replace('/');
    }
  }, [currentProfile, router]);

  // 自动保存草稿：评分与备注（必须在任何 return 之前声明，保持 hooks 数量一致）
  useEffect(() => {
    if (phase !== 'rating') return;
    const payload = { rating, note, ratingConfirmed };
    try { localStorage.setItem(draftKey, JSON.stringify(payload)); } catch {}
  }, [phase, rating, note, ratingConfirmed, draftKey]);

  // 进入评分阶段时加载草稿（同样在 return 之前）
  useEffect(() => {
    if (phase !== 'rating') return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.rating === 'number') setRating(data.rating);
        if (typeof data.note === 'string') setNote(data.note);
        if (typeof data.ratingConfirmed === 'boolean') setRatingConfirmed(data.ratingConfirmed);
      }
    } catch {}
  }, [phase, draftKey]);

  // 评分说明文案（在 return 之前）
  const ratingDesc = useMemo(() => {
    switch (rating) {
      case 1: return '很差（强烈不适或睡眠质量很差）';
      case 2: return '较差（不太舒服，睡眠质量较差）';
      case 3: return '一般（可接受，睡眠质量一般）';
      case 4: return '良好（较为舒服，睡眠质量较好）';
      case 5: return '极佳（非常舒服，睡眠质量极佳）';
      default: return '请选择星级（1-5）作为本次睡眠评分';
    }
  }, [rating]);

  if (!currentProfile) {
    return null;
  }

  if (!active) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <h1 className="text-xl font-semibold">没有进行中的睡眠</h1>
        <p className="mt-2 text-zinc-400">请在睡眠记录页点击“开始睡眠”。</p>
      </div>
    );
  }

  const typeLabel = active.type === 'main' ? '主睡眠' : '小睡';

  async function handleConfirm() {
    if (isSaving) return; // 防重复提交
    if (!rating) {
      alert('请先选择评分（1-5星）');
      return;
    }
    if (!ratingConfirmed) {
      alert('请先确认评分');
      return;
    }
    if (note.length > noteLimit) {
      alert(`备注字数超限（最多${noteLimit}字）`);
      return;
    }
    try {
      setIsSaving(true);
      await useAppStore.getState().endSleep(rating, note);
      // 清除草稿
      try { localStorage.removeItem(draftKey); } catch {}
      router.push('/records');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(`保存失败：${msg || '未知错误'}`);
    } finally {
      setIsSaving(false);
    }
  }


  const toggleQuickNote = (text: string) => {
    hapticPulse(8);
    setNote((prev) => {
      const has = prev.includes(text);
      let next = has ? prev.replace(text, '').replace(/\s*；\s*/g, '；').replace(/^；|；$/g, '') : (prev ? `${prev}；${text}` : text);
      // 清理多余分隔符与空格
      next = next.replace(/；{2,}/g, '；').trim();
      return next.slice(0, noteLimit + 5); // 允许稍微超出再由校验提示
    });
  };

  return (
    <>
      {/* 夜空背景（睡眠中页带云层与月光轻微变化） */}
      <NightSky variant="sleep" />
      <div className="mx-auto max-w-3xl p-6 min-h-screen flex flex-col relative z-10">
      {/* 顶部 */}
      <header className="mb-6">
        <h1 className="text-xl font-semibold">睡眠中</h1>
        <div className="text-sm text-zinc-400">账号：{currentProfile.name}</div>
      </header>

      {/* 中心状态展示 */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="text-2xl font-medium">{typeLabel}</div>
        <div className="mt-3 text-lg text-zinc-300">开始时间：{startTimeHHmm}</div>

        {phase === 'rating' && (
          <div className="mt-8 w-full max-w-md fade-in">
            <div className="mb-2 text-sm text-zinc-400">请为本次{typeLabel}选择星级评分（1-5），并确认。</div>
            {/* 星级评分 */}
            <div role="radiogroup" aria-label="睡眠评分" className="stars">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  className={`star-btn ${rating && rating >= n ? 'selected' : ''}`}
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} 星`}
                  onClick={() => { setRating(n); setRatingConfirmed(false); hapticPulse(10); }}
                >★</button>
              ))}
            </div>
            <div className="mt-2 text-xs text-zinc-500">{ratingDesc}</div>

            {/* 评分确认 */}
            <div className="mt-4">
              <button
                className="btn btn-primary"
                disabled={!rating}
                onClick={() => { setRatingConfirmed(true); hapticPulse(10); }}
              >确认评分</button>
              {!rating && (
                <span className="ml-2 text-xs text-zinc-500">请选择星级后再确认</span>
              )}
              {ratingConfirmed && (
                <span className="ml-2 text-xs text-emerald-400">已确认</span>
              )}
            </div>

            {/* 备注与增强 */}
            <div className="mt-6">
              <label className="block text-sm text-zinc-400 mb-1">备注（可选）</label>
              <input
                className="input w-full"
                placeholder="如：醒来精神好、做梦、多次醒来等"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="mt-1 text-xs text-zinc-500">{note.length}/{noteLimit} 字{note.length > noteLimit ? '（超出）' : ''}</div>
              {/* 快捷备注选项 */}
              <div className="mt-3 flex flex-wrap gap-2">
                {quickNotes.map((q) => {
                  const selected = note.includes(q);
                  return (
                    <button key={q} type="button" className={`chip ${selected ? 'selected' : ''}`} onClick={() => toggleQuickNote(q)}>{q}</button>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn" onClick={() => { setNote(''); setRatingConfirmed(!!rating); hapticPulse(8); }}>清除备注</button>
                <button className="btn" onClick={() => { try { localStorage.removeItem(draftKey); } catch {}; hapticPulse(8); }}>清除草稿</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 底部操作区 */}
      <footer className="mt-8">
        {phase === 'running' ? (
          <button
            className="w-full btn"
            onClick={() => { setPhase('rating'); hapticPulse(10); }}
          >结束睡眠</button>
        ) : (
          <button
            className="w-full btn btn-primary"
            disabled={isSaving || !ratingConfirmed || note.length > noteLimit}
            aria-busy={isSaving}
            onClick={handleConfirm}
          >{isSaving ? '正在保存…' : '确认保存'}</button>
        )}
      </footer>
      </div>
    </>
  );
}