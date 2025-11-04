/*
 * 生成弯月PNG图标（透明背景，平滑边缘），尺寸：192×192 与 512×512。
 * 风格参考 MoonPhase/NightSky 渐变与微光效果，保证与现有背景一致。
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function crescentSvg(size) {
  // 使用100x100视窗，通过遮罩形成弯月形状，叠加月面渐变与柔和阴影
  const R = 45; // 半径
  const CX = 50;
  const CY = 50;
  // 固定为清晰的峨眉月（盈），向右侧开口。d 越小越细，这里取 18 以保证打印与小尺寸清晰度。
  const d = 18;
  const shadowCx = CX + d; // 右侧遮罩圆心

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="moonFill" cx="35%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#f7f3d6" />
      <stop offset="40%" stop-color="#e9e3bd" />
      <stop offset="70%" stop-color="#c8c2a7" />
      <stop offset="100%" stop-color="#a9a38d" />
    </radialGradient>
    <radialGradient id="shade" cx="50%" cy="50%" r="65%">
      <stop offset="60%" stop-color="rgba(0,0,0,0)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.35)" />
    </radialGradient>
    <mask id="phaseMask">
      <rect x="0" y="0" width="100" height="100" fill="white" />
      <circle cx="${shadowCx}" cy="${CY}" r="${R}" fill="black" />
    </mask>
  </defs>

  <!-- 主体弯月（遮罩后可见区域）-->
  <g>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#moonFill)" mask="url(#phaseMask)" />
    <!-- 阴影层提升立体感 -->
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#shade)" style="mix-blend-mode:multiply" />
    <!-- 外缘微光描边（透明）-->
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="rgba(247,243,214,0.12)" stroke-width="0.8" />
  </g>
</svg>`;
}

async function generate() {
  const outDir = path.join(process.cwd(), 'public');
  const targets = [
    { size: 192, name: 'moon-icon-192.png' },
    { size: 512, name: 'moon-icon-512.png' },
  ];

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const t of targets) {
    const svg = crescentSvg(t.size);
    const outPath = path.join(outDir, t.name);
    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`✔ 已生成 ${t.name} (${t.size}x${t.size})`);
  }
}

generate().catch(err => {
  console.error('生成图标失败：', err);
  process.exit(1);
});