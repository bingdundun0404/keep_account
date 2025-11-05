const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SIZES = [192, 512];
const OUTPUT_DIR = path.join(__dirname, '..', 'public');

// Colors from globals.css and components
const NIGHT_SKY_COLOR_1 = '#070a14';
const NIGHT_SKY_COLOR_2 = '#0b0f1b';
const NIGHT_SKY_COLOR_3 = '#0b1023';
const MOON_FILL_INNER = '#f7f3d6';
const MOON_FILL_OUTER = '#a9a38d';

async function generateIcons() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const size of SIZES) {
    const CX = size / 2;
    const CY = size / 2;
    const R = size * 0.4;
    const SHADOW_OFFSET = R * 0.4;
    const ROTATION = 135; // Crescent opens to top-right

    const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${NIGHT_SKY_COLOR_1}" />
      <stop offset="65%" stop-color="${NIGHT_SKY_COLOR_2}" />
      <stop offset="100%" stop-color="${NIGHT_SKY_COLOR_3}" />
    </linearGradient>
    <radialGradient id="grad-moon" cx="50%" cy="50%" r="50%">
      <stop offset="70%" stop-color="${MOON_FILL_INNER}" />
      <stop offset="100%" stop-color="${MOON_FILL_OUTER}" />
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${size * 0.015}" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <rect width="${size}" height="${size}" fill="url(#grad-bg)" />

  <g transform="rotate(${ROTATION} ${CX} ${CY})">
    <circle
      cx="${CX}"
      cy="${CY}"
      r="${R}"
      fill="url(#grad-moon)"
      filter="url(#glow)"
    />
    <circle
      cx="${CX - SHADOW_OFFSET}"
      cy="${CY}"
      r="${R * 1.02}"
      fill="url(#grad-bg)"
    />
  </g>
</svg>
    `;

    const outputPath = path.join(OUTPUT_DIR, `icon_${size}.png`);
    try {
      await sharp(Buffer.from(svg))
        .png({ compressionLevel: 9, quality: 100 })
        .toFile(outputPath);
      console.log(`Successfully generated ${outputPath}`);
    } catch (error) {
      console.error(`Error generating icon for size ${size}:`, error);
    }
  }
}

generateIcons();