"use client";
import { useEffect, useMemo, useState } from "react";

type Hemisphere = "north" | "south";

/**
 * MoonPhase：实时显示当前月相（每分钟刷新），精度目标 ±12 小时。
 * 算法：使用平均朔望月与参考新月的 Lunation 近似计算相位角与照明比例。
 * - Julian Day = unixEpochDays + 2440587.5
 * - phase p = frac((JD - 2451550.1) / 29.530588853)
 * - angle = p * 360°
 * - illumination = 0.5 * (1 - cos(angle))
 * 视觉：使用 SVG 遮罩（mask）通过移动同半径阴影圆形实现弯月/半月/盈亏变化；
 *       同时叠加柔和阴影增强立体感，并支持视角旋转（南半球 180°）。
 */
export default function MoonPhase({
  hemisphere = "north",
  viewRotation = 0,
  refreshMs = 60_000,
}: {
  hemisphere?: Hemisphere;
  viewRotation?: number; // 视角旋转（度数），北半球默认 0，南半球默认 +180
  refreshMs?: number;
}) {
  // 首屏使用占位以避免 SSR 与客户端时间差导致的水合不匹配
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // 使用固定的初始时间戳，避免服务端和客户端初始化时间差异
  const [now, setNow] = useState<Date>(() => {
    // 将时间戳四舍五入到最近的分钟，确保服务端和客户端一致
    const currentTime = new Date();
    const roundedTime = new Date(Math.floor(currentTime.getTime() / 60000) * 60000);
    return roundedTime;
  });

  useEffect(() => {
    const id = setInterval(() => {
      // 同样将更新的时间四舍五入到分钟
      const currentTime = new Date();
      const roundedTime = new Date(Math.floor(currentTime.getTime() / 60000) * 60000);
      setNow(roundedTime);
    }, Math.max(10_000, refreshMs));
    return () => clearInterval(id);
  }, [refreshMs]);

  const data = useMemo(() => computeMoonPhase(now), [now]);
  const rotation = (hemisphere === "south" ? 180 : 0) + viewRotation;

  // SVG 参数（相对单位 100x100 视窗）
  const R = 45; // 半径
  const CX = 50;
  const CY = 50;
  const p = data.phase; // 0..1
  const d = p <= 0.5 ? 4 * R * p : 4 * R * (1 - p); // 阴影圆心距（0→新月，R→上/下弦，2R→满月）
  const dir = p <= 0.5 ? 1 : -1; // 盈→向右，亏→向左
  // 四舍五入到小数点后6位，避免服务端和客户端精度差异导致的水合不匹配
  const shadowCx = mounted
    ? Math.round((CX + dir * d) * 1000000) / 1000000
    : CX + 90; // 占位：将遮罩圆移出视窗，避免呈现动态月相导致水合差异

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label={mounted ? `月相：${data.phaseName}，照明比例 ${(data.illumination * 100).toFixed(1)}%` : "月相组件"}
      style={{ display: "block" }}
    >
      <defs>
        {/* 月面纹理与光泽（柔和） */}
        <radialGradient id="moonFill" cx="35%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#f7f3d6" />
          <stop offset="40%" stopColor="#e9e3bd" />
          <stop offset="70%" stopColor="#c8c2a7" />
          <stop offset="100%" stopColor="#a9a38d" />
        </radialGradient>
        {/* 暗部阴影（乘法混合） */}
        <radialGradient id="shade" cx="50%" cy="50%" r="65%">
          <stop offset="60%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
        </radialGradient>
        {/* 相位遮罩：用同半径黑圆移位实现盈亏变化 */}
        <mask id="phaseMask">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          {/* 黑圆作为遮罩切除区（相位） */}
          <circle cx={shadowCx} cy={CY} r={R} fill="black" />
        </mask>
      </defs>

      {/* 旋转以匹配观察视角 */}
      <g transform={`rotate(${rotation} ${CX} ${CY})`}>
        {/* 月面（相位遮罩后可见区域） */}
        <circle cx={CX} cy={CY} r={R} fill="url(#moonFill)" mask="url(#phaseMask)" />
        {/* 阴影层：增强立体感 */}
        <circle cx={CX} cy={CY} r={R} fill="url(#shade)" style={{ mixBlendMode: "multiply" }} />
        {/* 细微外发光描边 */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(247,243,214,0.12)" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

function computeMoonPhase(date: Date) {
  // Julian Day from Unix time (UTC)
  const jd = date.getTime() / 86400000 + 2440587.5;
  // Reference new moon: 2000-01-06 18:14 UTC (Meeus ref.)
  const epoch = 2451550.1;
  const synodicMonth = 29.530588853; // days
  let phase = ((jd - epoch) / synodicMonth) % 1;
  if (phase < 0) phase += 1;
  const angle = phase * 360; // degrees
  const illum = 0.5 * (1 - Math.cos((angle * Math.PI) / 180));
  const phaseName = phaseToName(phase);
  return { jd, phase, angle, illumination: illum, phaseName };
}

function phaseToName(p: number) {
  // 八分相命名（近似）：新月→上弦→满月→下弦
  if (p < 0.0625 || p >= 0.9375) return "新月";
  if (p < 0.1875) return "峨眉月（盈）";
  if (p < 0.3125) return "上弦前盈凸";
  if (p < 0.4375) return "上弦";
  if (p < 0.5625) return "盈凸月";
  if (p < 0.6875) return "满月";
  if (p < 0.8125) return "亏凸月";
  if (p < 0.9375) return "下弦";
  return "新月";
}