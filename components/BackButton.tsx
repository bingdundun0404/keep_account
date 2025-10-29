'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useNavigationStore } from '../store/navigationStore';

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { getBackRoute } = useNavigationStore();
  
  // 首页不显示返回
  if (pathname === '/') {
    return null;
  }
  
  const handleClick = () => {
    // 显式页面返回规则
    if (pathname.startsWith('/day/')) {
      router.push('/records');
      return;
    }
    if (pathname.startsWith('/records')) {
      router.push('/');
      return;
    }
    // 报表功能已移除，无需特殊处理
    if (pathname.startsWith('/settings')) {
      router.push('/records');
      return;
    }

    const prev = getBackRoute();
    if (prev) {
      router.push(prev);
    } else {
      router.push('/records');
    }
  };
  
  return (
    <button
      aria-label="返回上一页"
      onClick={handleClick}
      className="rounded border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800"
    >返回</button>
  );
}