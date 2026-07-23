#!/usr/bin/env node
/**
 * Generates ProConnect app icons from SVG (green brand + white leaf).
 * Run: node scripts/generate-app-icons.js
 */
const fs = require('fs');
const path = require('path');

const BRAND = '#16A34A';
const BRAND_DARK = '#12863D';
const WHITE = '#FFFFFF';
const OUT = path.join(__dirname, '../assets/images');

/** Leaf mark centered in a square viewBox (matches in-app BrandLogo). */
function leafSvg({ size, bg = BRAND, leaf = WHITE, rounded = 0.22, padding = 0.18 }) {
  const r = Math.round(size * rounded);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${bg}"/>
  <g transform="translate(${size / 2}, ${size / 2 + size * 0.02}) scale(${size * (1 - padding * 2) / 24}) translate(-12, -12)">
    <path fill="${leaf}" d="M12 2c0 0-8 7-8 12.5 0 3.5 2.8 6 6.5 6.3.2 0 .4 0 .6 0 3.7-.3 6.5-2.8 6.5-6.3C18 9 12 2 12 2zm0 15.8c-2-2.8-3.5-5.8-4.2-8.5 1.3.6 2.7 1.3 4.2 2.4 1.5-1.1 2.9-1.8 4.2-2.4-.7 2.7-2.2 5.7-4.2 8.5z"/>
  </g>
</svg>`;
}

/** Foreground-only leaf for Android adaptive icon (transparent bg). */
function leafForegroundSvg(size) {
  const pad = size * 0.22;
  const inner = size - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g transform="translate(${size / 2}, ${size / 2 + size * 0.02}) scale(${inner / 24}) translate(-12, -12)">
    <path fill="${WHITE}" d="M12 2c0 0-8 7-8 12.5 0 3.5 2.8 6 6.5 6.3.2 0 .4 0 .6 0 3.7-.3 6.5-2.8 6.5-6.3C18 9 12 2 12 2zm0 15.8c-2-2.8-3.5-5.8-4.2-8.5 1.3.6 2.7 1.3 4.2 2.4 1.5-1.1 2.9-1.8 4.2-2.4-.7 2.7-2.2 5.7-4.2 8.5z"/>
  </g>
</svg>`;
}

function solidSvg(size, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${color}"/></svg>`;
}

async function writePng(sharp, svg, filename, size) {
  const out = path.join(OUT, filename);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log(`  ✓ ${filename} (${size}px)`);
}

async function main() {
  const sharp = require('sharp');
  fs.mkdirSync(OUT, { recursive: true });

  console.log('Generating ProConnect app icons…');

  await writePng(sharp, leafSvg({ size: 1024 }), 'icon.png', 1024);
  await writePng(sharp, leafSvg({ size: 512 }), 'splash-icon.png', 512);
  await writePng(sharp, leafSvg({ size: 128 }), 'favicon.png', 128);

  // Android adaptive (432 = xxxhdpi safe reference)
  await writePng(sharp, leafForegroundSvg(432), 'android-icon-foreground.png', 432);
  await writePng(sharp, solidSvg(432, BRAND), 'android-icon-background.png', 432);
  await writePng(sharp, leafForegroundSvg(432).replace(WHITE, '#000000'), 'android-icon-monochrome.png', 432);

  // Store master SVG for future edits
  fs.writeFileSync(path.join(OUT, 'app-icon.svg'), leafSvg({ size: 1024 }));
  console.log('  ✓ app-icon.svg (source)');
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
