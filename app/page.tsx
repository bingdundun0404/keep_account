"use client";
import { useAppStore } from "../store/appStore";
import { useNavigationStore } from "../store/navigationStore";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import ConfirmDialog from "../components/ConfirmDialog";
import dynamic from "next/dynamic";
const NightSky = dynamic(() => import("../components/NightSky"), { ssr: false });
import type { Profile } from "../lib/types";

export default function Home() {
  const router = useRouter();
  const { profiles, currentProfile, loadInitial, deleteProfile } = useAppStore();
  const { pushRoute } = useNavigationStore();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string>("");

  useEffect(() => {
    pushRoute('/');
    loadInitial();
  }, [loadInitial, pushRoute]);

  const handleDeleteProfile = (id: string, name: string) => {
    setTargetId(id);
    setTargetName(name);
    setConfirmOpen(true);
  };

  const handleSelectProfile = (profile: Profile) => {
    useAppStore.getState().setProfile(profile).then(() => {
      router.push('/records');
    });
  };

  return (
    <>
      {/* 星空背景 */}
      <NightSky />
      <div className="mx-auto max-w-md p-6 min-h-screen flex flex-col relative z-10">
      {/* 顶部欢迎语 */}
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold text白">欢迎使用睡眠追踪系统</h1>
      </header>

      {/* 主体区域 */}
      <main className="flex-1 flex flex-col">
        {/* 账户列表 */}
        <div className="flex-1">
          {profiles.length === 0 ? (
            <div className="text-center text-zinc-400 py-8">
              <p>暂无账户</p>
              <p className="text-sm mt-2">点击下方按钮添加新账户</p>
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700"
                >
                  <button
                    onClick={() => handleSelectProfile(profile)}
                    className="flex-1 text-left hover:text-blue-400 transition-colors"
                  >
                    <div className="font-medium">{profile.name}</div>
                    {currentProfile?.id === profile.id && (
                      <div className="text-xs text-blue-400 mt-1">当前账户</div>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(profile.id, profile.name)}
                    className="ml-4 text-red-400 hover:text-red-300"
                  >删除</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作区：按钮右对齐与安全边距 */}
        <div className="mt-6 responsive-actions">
          <Link href="/onboarding" className="responsive-btn-text rounded border border-zinc-700 px-3 py-2">
            添加新账户
          </Link>
        </div>
      </main>

      <ConfirmDialog
        open={confirmOpen}
        title="确认删除账户"
        description={`删除账户“${targetName}”将清除所有与该账户相关的睡眠记录，且不可恢复。请输入账户名以确认。`}
        confirmText="确认删除"
        cancelText="取消"
        requireInput={{ placeholder: '输入账户名以确认', matchText: targetName }}
        onConfirm={async () => {
          if (!targetId) return;
          await deleteProfile(targetId);
          setConfirmOpen(false);
          setTargetId(null);
          setTargetName("");
        }}
        onCancel={() => {
          setConfirmOpen(false);
          setTargetId(null);
          setTargetName("");
        }}
      />
      </div>
    </>
  );
}
