// Copies the CSS, fonts and token JSON into dist/ after tsup has built the JavaScript.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
mkdirSync(join(dist, 'fonts'), { recursive: true });
const tokensCss = readFileSync(join(root, 'styles/tokens.css'), 'utf8');
const componentsCss = readFileSync(join(root, 'styles/components.css'), 'utf8');
writeFileSync(join(dist, 'tokens.css'), tokensCss);
writeFileSync(join(dist, 'styles.css'), tokensCss + '\n' + componentsCss);
writeFileSync(join(dist, 'fonts.css'), readFileSync(join(root, 'styles/fonts.css'), 'utf8'));
for (const f of readdirSync(join(root, 'fonts'))) copyFileSync(join(root, 'fonts', f), join(dist, 'fonts', f));
const src = readFileSync(join(root, 'src/generated/tokens.ts'), 'utf8');
const json = src.slice(src.indexOf('{'), src.lastIndexOf('} as const') + 1);
writeFileSync(join(dist, 'tokens.json'), JSON.stringify(JSON.parse(json), null, 2) + '\n');
console.log('css, fonts and tokens.json copied to dist/');
