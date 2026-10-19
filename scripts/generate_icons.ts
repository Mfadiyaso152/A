import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create the high quality custom SVG logo
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1220" />
      <stop offset="100%" stop-color="#131E30" />
    </linearGradient>
    <linearGradient id="lineGrad" x1="50%" y1="100%" x2="50%" y2="0%">
      <stop offset="0%" stop-color="#6588FF" stop-opacity="0.9" />
      <stop offset="60%" stop-color="#26D9C4" />
      <stop offset="100%" stop-color="#55FCE4" />
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#26D9C4" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#6588FF" stop-opacity="0.8" />
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Deep Canvas Background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />

  <!-- Subtle Grid Floor / Perspective Grid in lower quadrant -->
  <path d="M 64 420 L 448 420" stroke="#1E2E48" stroke-width="2" />
  <path d="M 112 360 L 400 360" stroke="#1E2E48" stroke-width="1.5" stroke-dasharray="6,6" />
  <path d="M 160 310 L 352 310" stroke="#1E2E48" stroke-width="1.5" stroke-dasharray="4,4" />

  <!-- Directional Ground Track (Path Line with perspective) -->
  <!-- Outer perspective path glow -->
  <polygon points="196,440 316,440 272,130 240,130" fill="url(#lineGrad)" opacity="0.18" />
  
  <!-- Active Tracking Path Line -->
  <path d="M 256 440 L 256 120" stroke="url(#lineGrad)" stroke-width="28" stroke-linecap="round" filter="url(#softGlow)" />
  <path d="M 256 440 L 256 120" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity="0.85" />

  <!-- Waypoint Nodes along the path line -->
  <circle cx="256" cy="400" r="12" fill="#6588FF" stroke="#F4F7FC" stroke-width="3" />
  <circle cx="256" cy="275" r="14" fill="#26D9C4" stroke="#F4F7FC" stroke-width="3" />
  <circle cx="256" cy="150" r="10" fill="#55FCE4" stroke="#F4F7FC" stroke-width="2.5" />

  <!-- Computer Vision Focus / Tracking Frame Brackets (Corner Brackets) -->
  <g stroke="url(#glowGrad)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <!-- Top-Left Bracket -->
    <path d="M 120 180 L 120 120 L 180 120" />
    <!-- Top-Right Bracket -->
    <path d="M 332 120 L 392 120 L 392 180" />
    <!-- Bottom-Left Bracket -->
    <path d="M 120 332 L 120 392 L 180 392" />
    <!-- Bottom-Right Bracket -->
    <path d="M 332 392 L 392 392 L 392 332" />
  </g>

  <!-- Horizontal Scan line through the center -->
  <line x1="140" y1="275" x2="372" y2="275" stroke="#26D9C4" stroke-width="3" stroke-dasharray="10,6" opacity="0.7" />

  <!-- Center Crosshair Tick Marks -->
  <line x1="256" y1="245" x2="256" y2="260" stroke="#26D9C4" stroke-width="3" stroke-linecap="round" />
  <line x1="256" y1="290" x2="256" y2="305" stroke="#26D9C4" stroke-width="3" stroke-linecap="round" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('Created icon.svg');

// 2. Generate PNG images for PWA manifest & Apple touch icon
function generateIconPNG(size: number, isMaskable: boolean): PNG {
  const png = new PNG({ width: size, height: size });
  const scale = size / 512;
  const paddingRatio = isMaskable ? 0.15 : 0.05;
  const contentScale = (1 - paddingRatio * 2) * scale;
  const offset = size * paddingRatio;

  // Background color #0B1220 = (11, 18, 32)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      // Slight vertical gradient to #131E30 (19, 30, 48)
      const grad = y / size;
      const r = Math.round(11 + (19 - 11) * grad);
      const g = Math.round(18 + (30 - 18) * grad);
      const b = Math.round(32 + (48 - 32) * grad);
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  // Draw central path line and corner targeting marks
  const cx = size / 2;
  const topY = offset + 120 * contentScale;
  const botY = size - offset - 72 * contentScale;
  const lineWidth = Math.max(4, Math.round(24 * contentScale));

  // Draw perspective path area
  for (let y = Math.floor(topY); y <= Math.ceil(botY); y++) {
    const t = (y - topY) / (botY - topY);
    // Path width tapers from top to bottom
    const halfW = (12 + t * 40) * contentScale;
    for (let x = Math.floor(cx - halfW); x <= Math.ceil(cx + halfW); x++) {
      if (x >= 0 && x < size) {
        const idx = (size * y + x) << 2;
        // Blend turquoise/blue
        const blend = 0.22;
        png.data[idx] = Math.round(png.data[idx] * (1 - blend) + 38 * blend);
        png.data[idx + 1] = Math.round(png.data[idx + 1] * (1 - blend) + 217 * blend);
        png.data[idx + 2] = Math.round(png.data[idx + 2] * (1 - blend) + 196 * blend);
      }
    }
  }

  // Draw solid tracking center line with turquoise/blue gradient
  for (let y = Math.floor(topY); y <= Math.ceil(botY); y++) {
    const t = (y - topY) / (botY - topY);
    const lineR = Math.round(38 * (1 - t) + 101 * t);
    const lineG = Math.round(217 * (1 - t) + 136 * t);
    const lineB = Math.round(196 * (1 - t) + 255 * t);

    for (let dx = -Math.floor(lineWidth / 2); dx <= Math.floor(lineWidth / 2); dx++) {
      const x = Math.round(cx + dx);
      if (x >= 0 && x < size) {
        const idx = (size * y + x) << 2;
        // Anti-alias edge
        const dist = Math.abs(dx) / (lineWidth / 2);
        const alpha = Math.max(0, 1 - Math.pow(dist, 3));
        png.data[idx] = Math.round(png.data[idx] * (1 - alpha) + lineR * alpha);
        png.data[idx + 1] = Math.round(png.data[idx + 1] * (1 - alpha) + lineG * alpha);
        png.data[idx + 2] = Math.round(png.data[idx + 2] * (1 - alpha) + lineB * alpha);
      }
    }
  }

  // Draw corner brackets
  const bracketSize = Math.round(50 * contentScale);
  const bracketThick = Math.max(3, Math.round(12 * contentScale));
  const bLeft = Math.round(cx - 130 * contentScale);
  const bRight = Math.round(cx + 130 * contentScale);
  const bTop = Math.round(cx - 130 * contentScale);
  const bBottom = Math.round(cx + 130 * contentScale);

  function drawBracket(bx: number, by: number, xDir: number, yDir: number) {
    // Horizontal segment
    for (let dy = -Math.floor(bracketThick / 2); dy <= Math.floor(bracketThick / 2); dy++) {
      for (let step = 0; step < bracketSize; step++) {
        const px = bx + step * xDir;
        const py = by + dy;
        if (px >= 0 && px < size && py >= 0 && py < size) {
          const idx = (size * py + px) << 2;
          png.data[idx] = 38;
          png.data[idx + 1] = 217;
          png.data[idx + 2] = 196;
        }
      }
    }
    // Vertical segment
    for (let dx = -Math.floor(bracketThick / 2); dx <= Math.floor(bracketThick / 2); dx++) {
      for (let step = 0; step < bracketSize; step++) {
        const px = bx + dx;
        const py = by + step * yDir;
        if (px >= 0 && px < size && py >= 0 && py < size) {
          const idx = (size * py + px) << 2;
          png.data[idx] = 38;
          png.data[idx + 1] = 217;
          png.data[idx + 2] = 196;
        }
      }
    }
  }

  drawBracket(bLeft, bTop, 1, 1);
  drawBracket(bRight, bTop, -1, 1);
  drawBracket(bLeft, bBottom, 1, -1);
  drawBracket(bRight, bBottom, -1, -1);

  // Target center node
  const dotR = Math.round(12 * contentScale);
  for (let dy = -dotR; dy <= dotR; dy++) {
    for (let dx = -dotR; dx <= dotR; dx++) {
      if (dx * dx + dy * dy <= dotR * dotR) {
        const px = Math.round(cx + dx);
        const py = Math.round(cx + dy);
        if (px >= 0 && px < size && py >= 0 && py < size) {
          const idx = (size * py + px) << 2;
          png.data[idx] = 244;
          png.data[idx + 1] = 247;
          png.data[idx + 2] = 252;
        }
      }
    }
  }

  return png;
}

const p192 = generateIconPNG(192, false);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), PNG.sync.write(p192));
console.log('Created pwa-192x192.png');

const p512 = generateIconPNG(512, false);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), PNG.sync.write(p512));
console.log('Created pwa-512x512.png');

const pMaskable = generateIconPNG(512, true);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), PNG.sync.write(pMaskable));
console.log('Created pwa-maskable-512x512.png');

const pApple = generateIconPNG(180, false);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), PNG.sync.write(pApple));
console.log('Created apple-touch-icon.png');
