"use client";
import React from 'react';

export default function UIPreviewPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">UI 预览：日历格子时间与“含小睡”标签（前后对比）</h1>

      <section>
        <h2 className="text-lg font-medium">调整前（示例）</h2>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="rounded-md p-2 border border-zinc-800 bg-zinc-900/30">
            <div className="text-xs text-zinc-400">1</div>
            <div className="mt-1 text-sm whitespace-nowrap tabular-nums">10.5h</div>
            <div className="mt-1 text-[10px] text-zinc-400">含小睡</div>
          </div>
          <div className="rounded-md p-2 border border-zinc-800 bg-zinc-900/30">
            <div className="text-xs text-zinc-400">2</div>
            <div className="mt-1 text-sm whitespace-nowrap tabular-nums">8.0h</div>
            <div className="mt-1 text-[10px] text-zinc-400">含小睡（示例很长很长很长很长很长）</div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">调整后（示例）</h2>
        <div className="grid grid-cols-2 gap-4 mt-3 calendar-grid">
          <div className="calendar-cell rounded-md p-2 border border-zinc-800 bg-zinc-900/30">
            <div className="text-xs text-zinc-400">1</div>
            <div className="mt-1 grid-time"><span className="grid-time-value">10.5</span><span className="grid-time-unit">h</span></div>
            <div className="mt-1 grid-nap text-zinc-400">含小睡</div>
          </div>
          <div className="calendar-cell rounded-md p-2 border border-zinc-800 bg-zinc-900/30">
            <div className="text-xs text-zinc-400">2</div>
            <div className="mt-1 grid-time"><span className="grid-time-value">8.0</span><span className="grid-time-unit">h</span></div>
            <div className="mt-1 grid-nap text-zinc-400">含小睡（示例很长很长很长很长很长）</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-zinc-400">在较窄屏幕下，后者会自动隐藏单位“h”并使用更紧凑的字号，防止溢出。</p>
      </section>
    </div>
  );
}