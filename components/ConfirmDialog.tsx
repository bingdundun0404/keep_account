"use client";
import { useEffect, useState } from 'react';

interface RequireInputConfig {
  placeholder?: string;
  matchText: string;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "确认删除",
  cancelText = "取消",
  onConfirm,
  onCancel,
  requireInput,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  requireInput?: RequireInputConfig;
}) {
  const [value, setValue] = useState("");
  useEffect(() => {
    if (!open) setValue("");
  }, [open]);

  const needMatch = !!requireInput;
  const allowConfirm = needMatch ? value === requireInput!.matchText : true;

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative z-10 w-[90%] max-w-md rounded-md border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="text-lg font-medium">{title}</h3>
        {description && <p className="mt-2 text-sm text-zinc-400">{description}</p>}
        {needMatch && (
          <div className="mt-3">
            <input
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              placeholder={requireInput?.placeholder ?? "输入以确认"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <p className="mt-1 text-xs text-zinc-500">需输入：{requireInput!.matchText}</p>
          </div>
        )}
        <div className="mt-4 flex justify-end gap-3">
          <button
            className="rounded border border-zinc-700 px-3 py-1 text-sm"
            onClick={onCancel}
          >{cancelText}</button>
          <button
            className={`rounded px-3 py-1 text-sm ${allowConfirm ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-300 cursor-not-allowed'}`}
            disabled={!allowConfirm}
            onClick={onConfirm}
          >{confirmText}</button>
        </div>
      </div>
    </div>
  );
}