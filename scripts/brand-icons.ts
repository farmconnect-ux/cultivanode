// Writes the icon SVGs from the logo in packages/shared/src/brand.ts. Run: npm run brand:icons
import { writeFileSync } from 'node:fs';
import { logoSvg } from '../packages/shared/src/brand.ts';

writeFileSync('apps/web/src/app/icon.svg', logoSvg() + '\n');
writeFileSync('apps/mobile/assets/icon.svg', logoSvg({ rounded: false, scale: 0.85 }) + '\n');
writeFileSync('apps/mobile/assets/icon-foreground.svg', logoSvg({ background: false, scale: 0.6 }) + '\n');
console.log('icons written');
