// Push the previewed package to GitHub. GitHub Actions then tests it again and publishes to npm if the version is new.
// Run `npm run preview` first and look at it.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const sh = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();
const die = (msg) => { console.error(`✗ ${msg}`); process.exit(1); };
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

if (!sh('git remote')) die('No git remote to push to.');
if (sh('git branch --show-current') !== 'main') die('Switch to main first.');
if (sh('git status --porcelain')) die('There are uncommitted changes. Commit or discard them, preview again, then release.');
sh('git fetch -q origin');
const ahead = sh('git log --oneline origin/main..HEAD');
if (!ahead) { console.log('Nothing to release: GitHub already has everything.'); process.exit(0); }
console.log(`Releasing ${pkg.name} ${pkg.version}:\n${ahead}\n`);
execSync('npm test', { stdio: 'inherit' });
execSync('git push origin main', { stdio: 'inherit' });
let published = '';
try { published = sh(`npm view ${pkg.name}@${pkg.version} version`); } catch { /* not on npm yet */ }
console.log(published === pkg.version
  ? `\n✓ Pushed. ${pkg.version} is already on npm, so nothing new publishes.`
  : `\n✓ Pushed. GitHub Actions publishes ${pkg.version} to npm in about 2–3 minutes (npm run status to check).`);
