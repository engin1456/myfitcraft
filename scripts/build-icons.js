/**
 * MyFitCraft icon builder.
 * Programmatically renders MFC monogram via SVG -> PNG with sharp.
 * Outputs all required Expo + Play Store icon variants in one shot.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');

// Brand
const ORANGE_TOP = '#FF8455';
const ORANGE_DEEP = '#D4451A';
const TEXT = '#FFFFFF';

function svg({ size = 1024, fontSize = 420, baselineY = 590 } = {}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="g" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="${ORANGE_TOP}"/>
      <stop offset="100%" stop-color="${ORANGE_DEEP}"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <text
    x="${size / 2}"
    y="${baselineY}"
    font-family="Impact, 'Haettenschweiler', 'Arial Narrow Bold', sans-serif"
    font-weight="900"
    font-size="${fontSize}"
    font-style="italic"
    fill="${TEXT}"
    text-anchor="middle"
    letter-spacing="-12"
    transform="skewX(-8 ${size / 2} ${baselineY})"
  >MFC</text>
</svg>`;
}

async function render({ size, fontSize, baselineY, out }) {
  const buf = await sharp(Buffer.from(svg({ size, fontSize, baselineY })))
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(ASSETS, out), buf);
  const meta = await sharp(buf).metadata();
  console.log(`${out.padEnd(36)} ${meta.width}x${meta.height} (${(buf.length / 1024).toFixed(1)}kb)`);
  return buf;
}

(async () => {
  const main = await render({ size: 1024, fontSize: 460, baselineY: 620, out: 'icon.png' });
  fs.writeFileSync(path.join(ASSETS, 'adaptive-icon.png'), main);
  console.log('adaptive-icon.png                    1024x1024 (copy)');
  fs.writeFileSync(path.join(ASSETS, 'splash-icon.png'), main);
  console.log('splash-icon.png                      1024x1024 (copy)');

  await sharp(main).resize(512, 512).png().toFile(path.join(ASSETS, 'play-store-icon-512.png'));
  console.log('play-store-icon-512.png              512x512 (resized)');

  await sharp(main).resize(48, 48).png().toFile(path.join(ASSETS, 'favicon.png'));
  console.log('favicon.png                          48x48 (resized)');

  // Play Store feature graphic — landscape brand banner
  const feature = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ORANGE_TOP}"/>
      <stop offset="100%" stop-color="${ORANGE_DEEP}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <text x="64" y="240"
    font-family="Impact, 'Haettenschweiler', sans-serif"
    font-weight="900" font-size="180" font-style="italic" fill="${TEXT}"
    letter-spacing="-6" transform="skewX(-8 64 240)">MFC</text>
  <text x="64" y="310"
    font-family="'Segoe UI', Helvetica, Arial, sans-serif"
    font-weight="700" font-size="56" fill="${TEXT}"
    letter-spacing="-1">MyFitCraft</text>
  <text x="64" y="380"
    font-family="'Segoe UI', Helvetica, Arial, sans-serif"
    font-weight="500" font-size="32" fill="${TEXT}"
    opacity="0.92">Antrenman planla. Takip et. İlerle.</text>
</svg>`;
  await sharp(Buffer.from(feature)).png().toFile(path.join(ASSETS, 'play-store-feature-1024x500.png'));
  console.log('play-store-feature-1024x500.png      1024x500 (rendered)');

  console.log('\nDone.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
