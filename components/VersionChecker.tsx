"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type VersionInfo = { version: string; releaseDate?: string; releaseNotes?: string };

export default function VersionChecker() {
  const [info, setInfo] = useState<VersionInfo | null>(null);
  const [status, setStatus] = useState<string>("");

  const fetchVersion = async () => {
    try {
      const res = await fetch('/version.json', { cache: 'no-store' });
      const data = await res.json();
      setInfo(data);
      const lastSeen = localStorage.getItem('sleep-app-version');
      if (!lastSeen) {
        localStorage.setItem('sleep-app-version', data.version);
        setStatus('首次检测，已记录当前版本');
      } else if (lastSeen !== data.version) {
        setStatus(`发现新版本：${data.version}`);
        localStorage.setItem('sleep-app-version', data.version);
      } else {
        setStatus('已是最新版本');
      }
    } catch (err) {
      setStatus('版本信息获取失败');
    }
  };

  useEffect(() => { fetchVersion(); }, []);

  return (
    <div className="mt-3 space-y-2">
      <div className="text-sm">当前版本：{info?.version ?? '未知'}</div>
      {info?.releaseDate && (
        <div className="text-xs text-zinc-500">发布日期：{info.releaseDate}</div>
      )}
      {info?.releaseNotes && (
        <div className="text-xs text-zinc-500">更新说明：{info.releaseNotes}</div>
      )}
      <div className="text-xs text-emerald-400">{status}</div>
      <div className="responsive-actions">
        <button onClick={fetchVersion} className="responsive-btn-text rounded border border-zinc-700 px-3 py-1 text-sm">检查更新</button>
        <Link href="/downloads" className="ml-2 responsive-btn-text rounded border border-zinc-700 px-3 py-1 text-sm">下载页</Link>
      </div>
    </div>
  );
}