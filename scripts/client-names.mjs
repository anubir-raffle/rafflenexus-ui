// The client-name guard. The list of names lives in scripts/client-names.local.txt, which is git-ignored:
// this repository is public, so the names themselves must never be committed. One name per line; # starts a comment.
// Marketing's machine has the file, so the sync and tests block client names there. Elsewhere (CI), the check is skipped.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export function clientNamePattern() {
  const file = process.env.CLIENT_NAMES_FILE || join(here, 'client-names.local.txt');
  if (!existsSync(file)) return null;
  const names = readFileSync(file, 'utf8').split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean);
  if (!names.length) return null;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(names.map((n) => `\\b${esc(n)}\\b`).join('|'), 'i');
}
