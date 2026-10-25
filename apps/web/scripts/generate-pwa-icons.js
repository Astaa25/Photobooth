const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function getSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#050C38"/>
  <rect x="16" y="16" width="480" height="480" rx="80" fill="none" stroke="#00E599" stroke-width="12"/>
  <rect x="28" y="28" width="456" height="456" rx="68" fill="none" stroke="#FE0168" stroke-width="6" stroke-dasharray="16 12"/>
  
  <rect x="96" y="160" width="320" height="240" rx="32" fill="#131947" stroke="#FFD84D" stroke-width="14"/>
  <path d="M 176 160 L 216 100 L 296 100 L 336 160 Z" fill="#FE0168" stroke="#FFD84D" stroke-width="10"/>
  
  <circle cx="256" cy="280" r="88" fill="#050C38" stroke="#5CE1E6" stroke-width="14"/>
  <circle cx="256" cy="280" r="56" fill="#1E1B4B" stroke="#00E599" stroke-width="10"/>
  <circle cx="256" cy="280" r="24" fill="#FE0168"/>
  <circle cx="236" cy="260" r="12" fill="#FFFFFF"/>

  <rect x="340" y="180" width="50" height="32" rx="8" fill="#FFD84D" stroke="#FFFFFF" stroke-width="4"/>

  <text x="256" y="460" font-family="monospace" font-weight="900" font-size="44" fill="#FFD84D" text-anchor="middle" letter-spacing="4">PHOTOBOOTH</text>
</svg>`;
}

async function run() {
  await sharp(Buffer.from(getSvg(192))).resize(192, 192).png().toFile(path.join(outDir, 'icon-192.png'));
  await sharp(Buffer.from(getSvg(512))).resize(512, 512).png().toFile(path.join(outDir, 'icon-512.png'));
  await sharp(Buffer.from(getSvg(512))).resize(512, 512).png().toFile(path.join(outDir, 'icon-maskable.png'));
  console.log('PWA icons created successfully in public/icons!');
}

run().catch(console.error);
