'use client';
import { useState } from 'react';
import dayjs from '@/lib/dayjs';
import { useAppStore } from '@/store/appStore';

interface ManualAddModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ManualAddModal({ open, onClose, onSuccess }: ManualAddModalProps) {
  const { saveManualSession } = useAppStore();
  const [type, setType] = useState<'main' | 'nap'>('main');
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState('23:00');
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [endTime, setEndTime] = useState('07:30');
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  // 计算时长显示
  const getDurationInfo = () => {
    const start = dayjs(`${startDate}T${startTime}`);
    const end = dayjs(`${endDate}T${endTime}`);
    
    if (end.isSameOrBefore(start)) {
      return { text: '请设置有效的时间范围', isValid: false };
    }
    
    const durationHours = end.diff(start, 'hour', true);
    if (durationHours > 24) {
      return { text: `时长 ${durationHours.toFixed(1)} 小时 (超过24小时限制)`, isValid: false };
    }
    
    return { 
      text: `时长 ${durationHours.toFixed(1)} 小时`, 
      isValid: true 
    };
  };

  const validateTimeRange = () => {
    const start = dayjs(`${startDate}T${startTime}`);
    const end = dayjs(`${endDate}T${endTime}`);
    
    if (end.isSameOrBefore(start)) {
      return '结束时间必须晚于开始时间';
    }
    
    const durationHours = end.diff(start, 'hour', true);
    if (durationHours > 24) {
      return '睡眠时长不能超过24小时';
    }
    
    return null;
  };

  const validateAndSave = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const start = dayjs(`${startDate}T${startTime}`);
      const end = dayjs(`${endDate}T${endTime}`);

      // 验证时间逻辑
      const timeError = validateTimeRange();
      if (timeError) {
        throw new Error(timeError);
      }

      // 验证评分
      if (rating < 1 || rating > 5) {
        throw new Error('评分必须为 1-5');
      }

      await saveManualSession({
        type,
        start: start.toISOString(),
        end: end.toISOString(),
        rating,
        note: note.trim()
      });

      // 重置表单
      setType('main');
      setStartDate(dayjs().format('YYYY-MM-DD'));
      setStartTime('23:00');
      setEndDate(dayjs().format('YYYY-MM-DD'));
      setEndTime('07:30');
      setRating(5);
      setNote('');
      setError(null);

      onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? '保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">添加睡眠记录</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded border border-red-800 bg-red-900/30 p-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-1">类型</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'main' | 'nap')}
              disabled={isSubmitting}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="main">主睡眠</option>
              <option value="nap">小睡</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">开始时间</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">结束时间</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
          </div>

          {/* 时长显示 */}
          <div className="rounded border border-zinc-700 bg-zinc-800/50 p-3">
            <div className="text-sm text-zinc-400 mb-1">睡眠时长</div>
            <div className={`text-sm font-medium ${getDurationInfo().isValid ? 'text-green-400' : 'text-red-400'}`}>
              {getDurationInfo().text}
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">评分 (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  disabled={isSubmitting}
                  className={`flex-1 rounded border py-2 text-sm disabled:opacity-50 ${
                    rating === n
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">备注 (可选)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
              placeholder="添加备注..."
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm disabled:opacity-50"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 rounded border border-zinc-700 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={validateAndSave}
            disabled={isSubmitting || !getDurationInfo().isValid}
            className="flex-1 rounded bg-blue-600 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:bg-zinc-600"
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}