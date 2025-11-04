"use client";
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === 'accepted') {
      console.log('PWA installed');
    }
  };

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="mt-3 space-y-2">
      {installed ? (
        <div className="text-sm text-emerald-400">已安装为应用</div>
      ) : deferred ? (
        <button onClick={handleInstall} className="responsive-btn-text rounded border border-zinc-700 px-4 py-2 text-sm">
          安装到桌面
        </button>
      ) : (
        <div className="text-xs text-zinc-500">
          {isIOS ? (
            <span>在 Safari 中使用“分享”→“添加到主屏幕”完成安装。</span>
          ) : (
            <span>当浏览器显示安装图标时，可点击地址栏安装或使用菜单中的“安装”。</span>
          )}
        </div>
      )}
    </div>
  );
}