// Preview the package before it's pushed: builds the demo from the local source, lists what hasn't gone to GitHub yet,
// and opens the demo in Chrome. Nothing is pushed or published. When it looks right, run `npm run release`.
//
//   npm run preview              build, serve on http://localhost:4180 and open it
//   npm run preview -- --no-open
import { execSync, spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 4180;
const URL = `http://localhost:${PORT}/`;
const sh = (cmd) => { try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const indent = (text) => text.split('\n').map((l) => '  ' + l).join('\n');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

execSync('npx vite build --config demo/vite.config.ts --logLevel warn', { stdio: 'inherit' });

const ahead = sh('git remote') ? sh('git log --oneline origin/main..HEAD') : '';
const published = sh(`npm view ${pkg.name} version`);
console.log(`\n${pkg.name} ${pkg.version} (npm has ${published || 'nothing yet'})`);
if (ahead) {
  console.log(`\nNot on GitHub yet:\n${indent(ahead)}`);
  console.log(`\nFiles changed:\n${indent(sh('git diff --stat origin/main..HEAD'))}`);
} else console.log('\nNothing waiting: the local package matches GitHub.');
const dirty = sh('git status --porcelain');
if (dirty) console.log(`\nUncommitted changes (in the preview, but release needs them committed):\n${dirty}`);

// Reuse a preview server this folder started; replace one started from another checkout so it never shows a stale build.
const STATE = join(tmpdir(), 'rnc-design-system-preview.json');
const isListening = () => new Promise((done) => {
  const s = createConnection(PORT, '127.0.0.1').on('connect', () => { s.end(); done(true); }).on('error', () => done(false));
});
let state = {};
try { state = JSON.parse(readFileSync(STATE, 'utf8')); } catch { /* no server started yet */ }
if (state.pid && state.cwd !== process.cwd()) {
  try { process.kill(-state.pid); } catch { /* already gone */ }
  await new Promise((r) => setTimeout(r, 500));
}
if (!(await isListening())) {
  const server = spawn('npx', ['vite', 'preview', '--config', 'demo/vite.config.ts', '--port', String(PORT), '--strictPort'], { detached: true, stdio: 'ignore' });
  server.unref();
  writeFileSync(STATE, JSON.stringify({ pid: server.pid, cwd: process.cwd() }));
  for (let i = 0; i < 20 && !(await isListening()); i++) await new Promise((r) => setTimeout(r, 250));
}

if (!process.argv.includes('--no-open')) {
  try { execSync(process.platform === 'darwin' ? `open -a "Google Chrome" ${URL}` : `xdg-open ${URL}`, { stdio: 'ignore' }); } catch { /* the address is printed below */ }
}
console.log(`\nPreview: ${URL}\nLooks right? npm run release   (pushes to GitHub; GitHub Actions publishes to npm)\n`);
