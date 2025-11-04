/*
 * 生成弯月PNG图标的旋转版本：绕中心逆时针精确旋转45°。
 * 输出：moon-icon-192_rot45.png / moon-icon-512_rot45.png
 * 画布尺寸、分辨率、色彩模式不变；透明背景；边缘平滑无锯齿。
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function crescentSvg(size, rotationDeg = -45) {
  const R = 45; // 半径
  const CX = 50;
  const CY = 50;
  const d = 18; // 峨眉厚度：保证小尺寸清晰，大尺寸不显得过细
  const shadowCx = CX + d; // 盈月向右开口

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
  <g transform="rotate(${rotationDeg} ${CX} ${CY})">
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#moonFill)" mask="url(#phaseMask)" />
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#shade)" style="mix-blend-mode:multiply" />
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="rgba(247,243,214,0.12)" stroke-width="0.8" />
  </g>
</svg>`;
}

async function writeTransformRecord(files, angle) {
  const outDir = path.join(process.cwd(), 'public');
  const metaPath = path.join(outDir, 'icon-transform.json');
  const record = {
    name: 'rotate',
    angle_deg: angle,
    files,
    source_files: files.map(f => f.replace('_rot45', '')),
    timestamp: new Date().toISOString(),
    reversible: true,
    revert_command: 'npm run revert:icons'
  };
  try {
    let meta = { operations: [] };
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }
    meta.operations.push(record);
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    console.log(`✔ 已记录可逆操作：旋转 ${angle}° → icon-transform.json`);
  } catch (e) {
    console.warn('⚠ 写入操作记录失败（不影响生成）：', e.message);
  }
}

async function generate() {
  const outDir = path.join(process.cwd(), 'public');
  const targets = [
    { size: 192, name: 'moon-icon-192_rot45.png' },
    { size: 512, name: 'moon-icon-512_rot45.png' },
  ];
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const t of targets) {
    const svg = crescentSvg(t.size, -45);
    const outPath = path.join(outDir, t.name);
    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`✔ 已生成 ${t.name} (${t.size}x${t.size})`);
  }

  await writeTransformRecord(targets.map(t => t.name), -45);
}

generate().catch(err => {
  console.error('生成旋转图标失败：', err);
  process.exit(1);
});