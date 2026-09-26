// Turns the SVG sources in assets/ into the PNGs Expo needs for the app icon and splash screen.
// PNGs are generated (and git-ignored) so the repo only holds the editable SVGs.
// Run: npm run icons --workspace @tillmate/mobile   (CI runs it before every Android build)
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const out = join(assets, 'generated');
await mkdir(out, { recursive: true });

const jobs = [
  // Full-bleed square icon (iOS and older Android launchers round the corners themselves).
  { src: 'icon.svg', dest: 'icon.png', size: 1024 },
  // Android adaptive icon: transparent foreground on the leaf-green background colour in app.config.ts.
  { src: 'icon-foreground.svg', dest: 'adaptive-foreground.png', size: 1024 },
  // Splash mark, shown centred on the leaf-green splash background.
  { src: 'icon-foreground.svg', dest: 'splash-icon.png', size: 512 },
];

for (const { src, dest, size } of jobs) {
  const svg = await readFile(join(assets, src));
  await sharp(svg, { density: 1200 }).resize(size, size).png().toFile(join(out, dest));
  console.log(`assets/generated/${dest} (${size}px)`);
}
