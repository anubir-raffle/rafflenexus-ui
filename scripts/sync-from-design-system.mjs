// Pulls the latest design-system files into this package, rebuilds, tests, bumps the version and commits.
// Run on Marketing's machine, where the RNC V2.1 design system lives next to this package:
//
//   node scripts/sync-from-design-system.mjs [--minor] [--message "What changed"] [--from ../project] [--push] [--dry-run] [--check]
//
// --check compares only: it writes nothing and exits 1 if the package is behind the design system.
//
// It copies tokens.json, the icons and node shapes from bundle.js, and the component styles from bundle.css.
// New components or changes to a component's behaviour are code: port those by hand in src/ in the same change.
// Pushing to main lets GitHub Actions publish the new version to npm (see .github/workflows/release.yml).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { clientNamePattern } from './client-names.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i > -1 && args[i + 1] ? args[i + 1] : d; };
const from = resolve(root, opt('--from', process.env.DS_PATH || '../project'));
const sh = (cmd) => execSync(cmd, { cwd: root, stdio: 'pipe', encoding: 'utf8' });
const die = (msg) => { console.error('\n✗ ' + msg); process.exit(1); };

if (!existsSync(join(from, 'tokens.json')) || !existsSync(join(from, 'components/bundle.js'))) die(`No design system found at ${from}. Pass --from <path to the design system's project folder>.`);
const CHECK = flag('--check');
const stale = [];
// In --check mode, compare instead of writing.
const put = (rel, content) => { const p = join(root, rel); if (CHECK) { if (!existsSync(p) || readFileSync(p, 'utf8') !== content) stale.push(rel); } else writeFileSync(p, content); };
if (!CHECK && sh('git status --porcelain').trim() && !flag('--dry-run')) die('The package has uncommitted changes. Commit or discard them first.');

// The package is public: client names never ship in it, not even in sample text.
// The names live in scripts/client-names.local.txt (git-ignored, Marketing's machine only).
const CLIENTS = clientNamePattern();
if (!CLIENTS) die('scripts/client-names.local.txt is missing. The sync needs it to keep client names out of this public package.');

// 1. Tokens (sample strings with client names are replaced)
const tokens = JSON.parse(readFileSync(join(from, 'tokens.json'), 'utf8'));
let scrubbed = 0;
const scrub = (o) => { for (const k of Object.keys(o)) { const v = o[k]; if (typeof v === 'string' && CLIENTS.test(v)) { o[k] = k === 'sample' ? 'Sample Hospital Home Lottery' : v.replace(new RegExp(CLIENTS, 'gi'), 'a sample client'); scrubbed++; } else if (v && typeof v === 'object') scrub(v); } };
scrub(tokens);
put('design/tokens.json', JSON.stringify(tokens, null, 1) + '\n');

// 2. Icons and node shapes, from bundle.js
const bundle = readFileSync(join(from, 'components/bundle.js'), 'utf8');
const grab = (name) => { const m = bundle.match(new RegExp(`var ${name} = (\\{.*?\\});\\n`)); if (!m) die(`Couldn't find ${name} in bundle.js. Has the design system's bundle changed shape?`); return JSON.parse(m[1]); };
put('design/icons.json', JSON.stringify(grab('ICONS'), null, 1) + '\n');
put('design/nodes.json', JSON.stringify(grab('NODES')) + '\n');

// 3. Component styles, from bundle.css: the shared sections, minus the design system's study and preview-only rules
const css = readFileSync(join(from, 'components/bundle.css'), 'utf8');
const cut = (a, b) => { const i = css.indexOf(a); if (i < 0) die(`bundle.css no longer has the section "${a}". Update the cut list in this script.`); const j = b ? css.indexOf(b, i) : css.length; if (b && j < 0) die(`bundle.css no longer has the section "${b}".`); return css.slice(i, j); };
let out = `/* @rafflenexuscanada/design-system component styles. Every colour comes from tokens.css.
   Generated from the design system's bundle.css by scripts/sync-from-design-system.mjs; edit the PATCHES there, not this file.
   Import "@rafflenexuscanada/design-system/styles.css" once (it includes the tokens). */

/* Optional base: put rnc-root on <body> (or an app wrapper) for the brand's page defaults. */
.rnc-root { margin: 0; font-family: var(--font-sans); background: var(--ground); color: var(--ink-body); font-size: 17px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
.rnc-row { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center; }

/* Headlines: Newsreader, for h1 and h2 only */
.rnc-h { font-family: var(--font-display); font-weight: 600; line-height: 1.04; letter-spacing: -0.015em; text-wrap: balance; margin: 0; color: var(--ink); }
.rnc-label { color: var(--ink-muted); }
.rnc-fig { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-weight: 500; }

` + [cut('/* Button */', '/* Flagship roster'), cut('/* Flagship roster', '/* Studies */'), cut('/* Icons: inline Phosphor', '/* Preview control')].join('\n');
// Package-only names and fixes. Each anchor must still exist; if one doesn't, the design changed and this needs a look.
const PATCHES = [
  [/\.odo-col/g, '.rnc-odo-col'], [/\.odo-d\b/g, '.rnc-odo-d'], [/\.odo-s\b/g, '.rnc-odo-s'], [/\.odo\b/g, '.rnc-odo'],
  ['/* Odometer (RNC.odometer): rolling digits for real figures.', '/* Odometer: rolling digits for real figures.'],
  ['/* Ticket button (RNC.ticketButtonHtml): the buy action as a ticket.', '/* TicketButton: the buy action as a ticket.'],
  // ProofStat wraps after the number and scales down on phones
  ['font: 500 56px/1 var(--font-mono); letter-spacing: -0.02em; white-space: nowrap;', 'font: 500 clamp(40px, 11vw, 56px)/1 var(--font-mono); letter-spacing: -0.02em;'],
  ['.rnc-proof .rnc-big em { font-style: normal; color: var(--ink-muted); }', '.rnc-proof .rnc-big em { font-style: normal; color: var(--ink-muted); white-space: nowrap; }'],
  // TicketButton can render as a <button>
  ['.rnc-tbtn.big { min-height: 58px;', 'button.rnc-tbtn { border: 0; padding: 0; background: none; font-family: inherit; text-align: left; }\n.rnc-tbtn.big { min-height: 58px;'],
  ['.rnc-tbtn.full { display: flex; }', '.rnc-tbtn.full { display: flex; width: 100%; box-sizing: border-box; }'],
];
for (const [a, b] of PATCHES) {
  if (typeof a === 'string' ? !out.includes(a) : !a.test(out)) die(`Style patch no longer applies: ${a}. Check bundle.css and update PATCHES.`);
  if (a instanceof RegExp) a.lastIndex = 0;
  out = out.replace(a, b);
}
for (const bad of ['.rnc-pair', 'rnc-replay', 'rnc-mono-']) if (out.includes(bad)) die(`Study or preview-only rule "${bad}" leaked into the package styles.`);
put('styles/components.css', out.trimEnd() + '\n');
if (CHECK) {
  if (stale.length) { console.log('✗ Behind the design system: ' + stale.join(', ')); process.exit(1); }
  console.log('✓ Matches the design system.'); process.exit(0);
}

// 4. Rebuild and test
console.log(`Synced from ${from}${scrubbed ? ` (${scrubbed} client-name sample${scrubbed > 1 ? 's' : ''} replaced)` : ''}. Building and testing…`);
try { sh('npm run typecheck'); sh('npm test'); } catch (e) { die('Build or tests failed:\n' + (e.stdout || '') + (e.stderr || '')); }

const changed = sh('git status --porcelain').split('\n').filter((l) => l.trim()).map((l) => l.slice(3));
if (!changed.length) { console.log('✓ Already up to date. Nothing to release.'); process.exit(0); }
console.log('Changed:\n  ' + changed.join('\n  '));
if (flag('--dry-run')) { console.log('\n(dry run: nothing bumped or committed; run `git checkout -- .` to discard)'); process.exit(0); }

// 5. Version, changelog, commit (and push)
const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const [maj, min, pat] = pkg.version.split('.').map(Number);
pkg.version = flag('--minor') ? `${maj}.${min + 1}.0` : `${maj}.${min}.${pat + 1}`;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
const message = opt('--message', 'Synced with the design system');
const areas = [...new Set(changed.map((f) => (f.startsWith('design/tokens') || f.startsWith('styles/tokens') || f.includes('generated/tokens') ? 'tokens' : f.includes('icons') ? 'icons' : f.includes('nodes') ? 'node graphics' : f.startsWith('styles/components') ? 'component styles' : null)).filter(Boolean))];
const date = new Date().toISOString().slice(0, 10);
const logPath = join(root, 'CHANGELOG.md');
const log = readFileSync(logPath, 'utf8');
writeFileSync(logPath, log.replace('# Changelog\n\n', `# Changelog\n\n## ${pkg.version} (${date})\n\n- ${message}.${areas.length ? ' Updated: ' + areas.join(', ') + '.' : ''}\n\n`));
sh('git add -A');
sh(`git commit -q -m ${JSON.stringify(`Release ${pkg.version}: ${message}`)}`);
console.log(`✓ Committed ${pkg.version}.`);
if (flag('--push')) {
  if (!sh('git remote').trim()) die('No git remote yet. Add the GitHub repo (git remote add origin …) and push.');
  sh('git push origin HEAD');
  console.log('✓ Pushed. GitHub Actions will test and publish it to npm.');
} else console.log('Not pushed. Check it with npm run preview, then npm run release to publish it.');
