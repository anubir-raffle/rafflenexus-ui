// `npm run status`: is every link in the chain in sync?
//   1. Design system → this package   (does the package hold the latest tokens, icons and styles?)
//   2. This package → the git remote   (is every commit pushed to GitHub or Bitbucket?)
//   3. The git remote → npm            (is the current version published?)
// Exits 0 when all three are in sync, 1 otherwise. Link 1 is skipped where the design system isn't on disk.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd) => { try { return { ok: true, out: execSync(cmd, { cwd: root, stdio: 'pipe', encoding: 'utf8' }).trim() }; } catch (e) { return { ok: false, out: ((e.stdout || '') + (e.stderr || '')).trim() }; } };
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
let allGood = true;
const line = (ok, label, detail) => { if (ok === false) allGood = false; console.log(`${ok === true ? '✓' : ok === false ? '✗' : '–'} ${label}${detail ? '\n    ' + detail : ''}`); };

console.log(`${pkg.name} ${pkg.version}\n`);

// 1. Design system → package
const ds = resolve(root, process.env.DS_PATH || '../project');
if (existsSync(join(ds, 'tokens.json'))) {
  const r = spawnSync(process.execPath, ['scripts/sync-from-design-system.mjs', '--check', '--from', ds], { cwd: root, encoding: 'utf8' });
  const msg = (r.stdout + r.stderr).trim().split('\n').pop();
  line(r.status === 0, 'Design system → package', r.status === 0 ? 'The package has the latest tokens, icons and component styles.' : msg.replace(/^✗ /, '') + '\n    Fix: npm run sync');
} else line(null, 'Design system → package', "Skipped: the design system isn't on this computer (only Marketing's machine has it).");

// 2. Package → git remote
const remote = run('git remote get-url origin');
const host = /github/.test(remote.out) ? 'GitHub' : /bitbucket/.test(remote.out) ? 'Bitbucket' : 'the remote';
const label2 = `Package → ${host}`;
if (!remote.ok) line(false, 'Package → git remote', 'No remote set. Fix: git remote add origin <repository address>');
else {
  const dirty = run('git status --porcelain').out;
  const fetched = run('git fetch -q origin');
  const branch = run('git rev-parse --abbrev-ref HEAD').out || 'main';
  const counts = run(`git rev-list --left-right --count HEAD...origin/${branch}`);
  const [ahead, behind] = counts.ok ? counts.out.split(/\s+/).map(Number) : [NaN, NaN];
  if (!fetched.ok) line(false, label2, `Couldn't reach ${host}: ` + fetched.out.split('\n')[0]);
  else if (dirty) line(false, label2, 'There are uncommitted changes. Fix: npm run sync (or commit them).');
  else if (!counts.ok) line(false, label2, `${host} has no ${branch} branch yet. Fix: git push -u origin ${branch}`);
  else if (ahead > 0) line(false, label2, `${ahead} commit${ahead > 1 ? 's' : ''} not pushed yet. Fix: git push`);
  else if (behind > 0) line(false, label2, `${host} has ${behind} commit${behind > 1 ? 's' : ''} this copy doesn't. Fix: git pull`);
  else line(true, label2, `${host} ${branch} matches this copy (${run('git rev-parse --short HEAD').out}).`);
}

// 3. git remote → npm
const v = run(`npm view ${pkg.name} version --registry=https://registry.npmjs.org/ --prefer-online`);
if (!v.ok && /E404|404/.test(v.out)) line(false, `${host === 'the remote' ? 'Remote' : host} → npm`, `npm doesn't list ${pkg.name} yet. Just after a first publish this can take a few minutes; otherwise publish ${pkg.version} once by hand (npm publish).`);
else if (!v.ok) line(false, `${host} → npm`, "Couldn't reach npm: " + v.out.split('\n')[0]);
else if (v.out === pkg.version) line(true, `${host} → npm`, `npm has ${v.out}, the current version.`);
else line(false, `${host} → npm`, `npm has ${v.out}; the package is at ${pkg.version}. The release pipeline should publish it within a few minutes (check its run page if it doesn't).`);

console.log(allGood ? '\nEverything is in sync.' : '\nNot fully in sync yet (see ✗ above).');
process.exit(allGood ? 0 : 1);
