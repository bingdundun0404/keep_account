/*
 * 一键复位：删除_rot45文件并确保基础图标存在。
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function safeUnlink(p) {
  try { if (fs.existsSync(p)) { fs.unlinkSync(p); console.log('✔ 已删除', path.basename(p)); } } catch (e) { console.warn('⚠ 删除失败', p, e.message); }
}

function appendRecord() {
  const outDir = path.join(process.cwd(), 'public');
  const metaPath = path.join(outDir, 'icon-transform.json');
  try {
    let meta = { operations: [] };
    if (fs.existsSync(metaPath)) meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    meta.operations.push({ name: 'revert', timestamp: new Date().toISOString() });
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    console.log('✔ 已记录复位操作 → icon-transform.json');
  } catch (e) { console.warn('⚠ 记录复位失败：', e.message); }
}

function main() {
  const outDir = path.join(process.cwd(), 'public');
  safeUnlink(path.join(outDir, 'moon-icon-192_rot45.png'));
  safeUnlink(path.join(outDir, 'moon-icon-512_rot45.png'));

  // 确保基础图标存在
  const base192 = path.join(outDir, 'moon-icon-192.png');
  const base512 = path.join(outDir, 'moon-icon-512.png');
  if (!fs.existsSync(base192) || !fs.existsSync(base512)) {
    console.log('ℹ 基础图标缺失，正在重新生成...');
    const r = spawnSync(process.execPath, [path.join(process.cwd(), 'scripts', 'generate-moon-icons.js')], { stdio: 'inherit' });
    if (r.status !== 0) {
      console.error('生成基础图标失败');
      process.exit(r.status || 1);
    }
  }

  appendRecord();
}

main();