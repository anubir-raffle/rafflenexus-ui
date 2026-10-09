// Preview the package before it's pushed: builds the demo from the local source, lists what hasn't gone to GitHub yet,
// and opens the demo in Chrome. Nothing is pushed or published. When it looks right, run `npm run release`.
//
//   npm run preview              build, serve on http://localhost:4180 and open it
//   npm run preview -- --no-open
import { execSync, spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { readFileSync } from 'node:fs';

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

// Always serve this folder's build: stop any earlier demo preview on the port (from this or another checkout), then start
// a fresh one. "localhost" can be IPv4 or IPv6, so both are checked. Anything else on the port is left alone and reported.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const answers = (host) => new Promise((done) => {
  const s = createConnection(PORT, host).on('connect', () => { s.end(); done(true); }).on('error', () => done(false));
});
const isListening = async () => (await answers('127.0.0.1')) || (await answers('::1'));
for (const pid of sh(`lsof -ti tcp:${PORT} -sTCP:LISTEN`).split('\n').filter(Boolean)) {
  const cmd = sh(`ps -o command= -p ${pid}`);
  if (/vite(\.js)? preview/.test(cmd) && cmd.includes('demo/vite.config.ts')) { try { process.kill(Number(pid)); } catch { /* already gone */ } }
  else { console.error(`\nPort ${PORT} is in use by another program (${cmd || 'pid ' + pid}). Close it and run npm run preview again.`); process.exit(1); }
}
for (let i = 0; i < 20 && (await isListening()); i++) await wait(150);
spawn('npx', ['vite', 'preview', '--config', 'demo/vite.config.ts', '--port', String(PORT), '--strictPort'], { detached: true, stdio: 'ignore' }).unref();
for (let i = 0; i < 40 && !(await isListening()); i++) await wait(250);
if (!(await isListening())) { console.error(`\nThe preview server didn't start on port ${PORT}.`); process.exit(1); }

if (!process.argv.includes('--no-open')) {
  try { execSync(process.platform === 'darwin' ? `open -a "Google Chrome" ${URL}` : `xdg-open ${URL}`, { stdio: 'ignore' }); } catch { /* the address is printed below */ }
}
console.log(`\nPreview: ${URL}\nLooks right? npm run release   (pushes to GitHub; GitHub Actions publishes to npm)\n`);
