import DayDetailClient from './DayDetailClient';

export function generateStaticParams() {
  const days = 365; // 预生成最近一年日期，满足静态导出
  const params: { date: string }[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    params.push({ date: format(d) });
  }
  return params;
}

export default function Page() {
  return <DayDetailClient />;
}