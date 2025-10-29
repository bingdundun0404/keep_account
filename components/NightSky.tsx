/**
 * 夜空背景组件：用于“睡眠记录页”和“睡眠中页”。
 * - 深色基调，包含月亮与星星
 * - 星星轻微闪烁与层次移动（CSS 动画，性能友好）
 * - 睡眠中页额外云层缓慢移动
 * - 不影响交互（pointer-events: none），内容需在其之上（z-index）
 */
import MoonPhase from './MoonPhase';

export default function NightSky({ variant = 'records' }: { variant?: 'records' | 'sleep' }) {
  const withClouds = variant === 'sleep';
  return (
    <div className="night-sky" aria-hidden>
      <div className="night-sky__gradient" />
      {/* 月亮外层光晕 */}
      <div className="night-sky__moon" />
      {/* 精确月相（每分钟刷新），叠加在光晕之上 */}
      <div className="night-sky__moon-phase">
        <MoonPhase hemisphere="north" refreshMs={60_000} />
      </div>

      {/* 星空三层，制造空间层次与轻微移动 */}
      <div className="night-sky__stars night-sky__stars--far" />
      <div className="night-sky__stars night-sky__stars--mid" />
      <div className="night-sky__stars night-sky__stars--near" />

      {/* 睡眠中页：柔和云层 */}
      {withClouds && (
        <>
          <div className="night-sky__cloud night-sky__cloud--1" />
          <div className="night-sky__cloud night-sky__cloud--2" />
        </>
      )}

      {/* 暗角提升内容可读性 */}
      <div className="night-sky__vignette" />
    </div>
  );
}