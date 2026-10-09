// Renders every component from the built package (ESM and CJS) and checks the published files carry no client names.
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import * as DS from '../dist/index.js';
import { clientNamePattern } from './client-names.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const h = React.createElement;
let fails = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); if (!ok) fails++; };
const render = (el) => renderToString(el);

const cases = [
  ['Button', h(DS.Button, null, 'Talk to our lottery team'), ['rnc-btn-primary', 'Talk to our lottery team']],
  ['Button as link', h(DS.Button, { href: '/contact', variant: 'secondary' }, 'Book a call'), ['<a', 'href="/contact"', 'rnc-btn-secondary']],
  ['Icon', h(DS.Icon, { name: 'ticket' }), ['rnc-icon', 'aria-hidden="true"', '<path']],
  ['VerifiedBadge', h(DS.VerifiedBadge, { regulator: 'IGCO', licence: '171012' }), ['IGCO licence #171012', 'GLI-certified RNG']],
  ['LedgerLine', h(DS.LedgerLine, { items: [{ label: 'Tickets', value: '12,400' }, { label: 'Reconciled', value: 'Yes', done: true }] }), ['rnc-ledger', 'is-done', '12,400']],
  ['ProofStat', h(DS.ProofStat, { value: 11, of: 29, label: 'flagship lotteries', source: 'Research count · 5 Oct 2026' }), ['rnc-proof', ' of ', 'Research count']],
  ['JackpotFigure', h(DS.JackpotFigure, { amount: 2548700, growth: 'Up $1,240 since yesterday' }), ['aria-label="$2,548,700"', 'rnc-jp-sep', 'rnc-jp-perf', 'Up $1,240']],
  ['JackpotTile', h(DS.JackpotTile, { program: 'Sample Hospital Lottery', amount: 10640, province: 'BC' }), ['Live · BC', 'Sample Hospital Lottery', '$10,640']],
  ['FlagshipRoster', h(DS.FlagshipRoster, { groups: [{ province: 'BC', items: ['Sample Lottery A', 'Sample Lottery B'] }, { province: 'SK', items: [] }] }), ['British Columbia', 'Sample Lottery A', 'None yet']],
  ['PoweredBy', h(DS.PoweredBy), ['Powered by', 'data:image/png;base64']],
  ['LeaderHero', h(DS.LeaderHero, { sub: 'The platform behind charity lotteries in five provinces.', tiles: [{ program: 'Sample 50/50', amount: 5000 }] }), ["Canada&#x27;s raffle leader.", 'rnc-stage', 'Talk to our lottery team', 'Sample 50/50']],
  ['RaffleBrand', h(DS.RaffleBrand, { logo: { src: '/logo.png', alt: 'Sample 50/50' }, sponsor: { src: '/sponsor.png', alt: 'Sample Credit Union', label: 'Presented by' }, strip: true }), ['rnc-rb', 'Sample 50/50, home', 'Presented by', 'rnc-rb-strip']],
  ['NodeGraphic', h(DS.NodeGraphic, { name: 'triad', size: 200 }), ['rnc-node', 'viewBox="0 0 523 466"', 'width="200"']],
  ['Odometer', h(DS.Odometer, { value: 684270, prefix: '$' }), ['aria-label="$684,270"', '$684,270']],
  ['TicketButton', h(DS.TicketButton, { label: 'Order tickets', stub: 'from $10', href: '#order' }), ['rnc-tbtn', 'aria-label="Order tickets, from $10"', 'tb-stub', 'href="#order"']],
  ['TicketButton as button', h(DS.TicketButton, { label: 'Buy tickets', size: 'big', fullWidth: true, colors: { bg: '#5a3fc0' } }), ['<button', 'big', 'full', '--tb-bg:#5a3fc0']],
  ['TextField', h(DS.TextField, { label: 'Email', id: 'em', type: 'email', error: 'Enter your email.' }), ['rnc-input', 'for="em"', 'aria-invalid="true"', 'em-error']],
  ['Select', h(DS.Select, { label: 'Province', placeholder: 'Choose', options: [{ value: 'BC', label: 'BC' }] }), ['rnc-select-wrap', 'Choose']],
  ['Checkbox and RadioGroup', h('div', null, h(DS.Checkbox, { label: 'Agree' }), h(DS.RadioGroup, { legend: 'Delivery', name: 'd', options: [{ value: 'e', label: 'Email' }] })), ['type="checkbox"', 'rnc-fieldset', 'type="radio"']],
  ['Switch', h(DS.Switch, { label: 'Live jackpot', checked: true, onChange: () => {} }), ['role="switch"', 'aria-checked="true"']],
  ['ErrorSummary', h(DS.ErrorSummary, { errors: [{ fieldId: 'em', message: 'Enter your email.' }] }), ['rnc-errsum', 'href="#em"']],
  ['Dropdown', h(DS.Dropdown, { label: 'Export', items: [{ label: 'CSV' }] }), ['aria-haspopup="menu"', 'role="menu"', 'hidden']],
  ['Sidebar', h(DS.Sidebar, { logo: 'RNC', items: [{ label: 'Dashboard', href: '/', icon: 'chart-line-up', current: true }, { label: 'Raffles', href: '/r', icon: 'ticket', badge: '3' }] }), ['rnc-sidebar', 'aria-current="page"', 'aria-label="Raffles, 3"', 'rnc-icon']],
  ['Offcanvas (closed renders nothing)', h('div', { 'data-x': '1' }, h(DS.Offcanvas, { open: false, onClose: () => {}, title: 'Menu' })), ['data-x="1"']],
  ['Button loading (keeps its width)', h(DS.Button, { loading: true, loadingText: 'Saving…', startIcon: 'plus' }, 'Save'), ['aria-busy="true"', 'rnc-btn-stack', 'rnc-btn-spinner', 'Saving…', 'type="button"']],
  ['Button icon-only, small, danger-ghost', h(DS.Button, { iconOnly: true, startIcon: 'x', 'aria-label': 'Remove', size: 'sm', variant: 'danger-ghost' }), ['rnc-btn-icon', 'rnc-btn-sm', 'rnc-btn-danger-ghost', 'aria-label="Remove"']],
  ['Avatar initials', h(DS.Avatar, { alt: 'Priya Sharma' }), ['rnc-avatar-pic', 'role="img"', 'aria-label="Priya Sharma"', '>PS<', '--av-size:40px']],
  ['Avatar with a name', h(DS.Avatar, { src: '/a.jpg', name: 'Ava Martin', subtitle: 'Admin', size: 'md' }), ['alt=""', 'rnc-avatar-name', 'Admin', '--av-size:32px']],
  ['AvatarGroup', h(DS.AvatarGroup, { max: 2 }, h(DS.Avatar, { alt: 'A B' }), h(DS.Avatar, { alt: 'C D' }), h(DS.Avatar, { alt: 'E F' })), ['rnc-avatar-group', 'aria-label="2 more"', '+2']],
  ['Sidebar with toggle, action, footer, external item', h(DS.Sidebar, { logo: 'RNC', onCollapsedChange: () => {}, primaryAction: { label: 'New setup form' }, footer: ({ collapsed }) => (collapsed ? 'v' : 'What’s new'), items: [{ label: 'Reveal', href: 'https://reveal.example.org', external: true, target: '_blank', icon: 'drone' }, { label: 'App builds', href: '/b', description: 'Admins only' }] }), ['rnc-sidebar-toggle', 'aria-label="Collapse menu"', 'rnc-btn-full', 'New setup form', 'What’s new', 'rnc-sidebar-ext', 'Reveal, opens in a new tab', 'rnc-sidebar-desc']],
  ['Table', h(DS.Table, { caption: 'Orders', data: [{ n: 'Ava', a: 50 }], columns: [{ accessorKey: 'n', header: 'Name' }, { accessorKey: 'a', header: 'Amount', meta: { numeric: true } }] }), ['rnc-table', 'aria-sort="none"', '>Ava<', 'is-num']],
];
for (const [name, el, expect] of cases) {
  try { const html = render(el); const missing = expect.filter((s) => !html.includes(s)); check(name, !missing.length, missing.length ? 'missing ' + missing.join(', ') : ''); }
  catch (e) { check(name, false, e.message); }
}
const hex = /^#[0-9a-f]{6}$/i;
check('tokens', ['action', 'ink', 'stage', 'ground', 'reward', 'verified', 'focus'].every((k) => hex.test(DS.tokens.color[k])) && DS.tokens.font.display.startsWith('Newsreader') && DS.tokens.font.mono.includes('DM Mono'));
check('icon names', DS.ICON_NAMES.length >= 39 && ['ticket', 'x', 'list', 'user', 'plus', 'upload-simple', 'arrow-square-out', 'caret-left', 'caret-right'].every((n) => DS.ICON_NAMES.includes(n)));
const require = createRequire(import.meta.url);
const cjs = require('../dist/index.cjs');
check('CommonJS build', typeof cjs.TicketButton === 'function' && typeof cjs.JackpotFigure === 'function');

// The /inputs entry (MUI + react-final-form). Rendered from the CommonJS build: MUI 5's subpath imports
// (@mui/material/TextField) need a bundler for ESM, as they do in the app itself.
check('main entry has no MUI or SweetAlert2', !/@mui|@emotion|react-final-form|sweetalert2/.test(readFileSync(join(root, 'dist/index.js'), 'utf8')));
const IN = require('../dist/inputs.cjs');
const noop = () => {};
const inputCases = [
  ['inputs: TextInput', h(IN.TextInput, { label: 'Support Email', tooltip: 'Shown to ticket buyers.', value: 'help@example.org', onChange: noop }), ['rnc-field-labelrow', 'aria-label="About Support Email"', 'value="help@example.org"', 'MuiOutlinedInput-root']],
  ['inputs: TextInput review mode', h(IN.TextInput, { label: 'Support Email', value: 'help@example.org', disabledAll: true, onChange: noop }), ['is-review', 'disabled=""', 'cursor:copy']],
  ['inputs: TextInput dropdown', h(IN.TextInput, { type: 'dropdown', label: 'Province', options: [{ label: 'Alberta', value: 'AB' }], value: 'AB', input: { value: 'AB', onChange: noop } }), ['role="combobox"', '>Province</label>']], // Autocomplete fills its text after mount
  ['inputs: InputMasked', h(IN.InputMasked, { label: 'Organization URL', pre: 'https://', input: { value: 'example.org', onChange: noop } }), ['https://', 'value="example.org"']],
  ['inputs: DatePicker', h(IN.DatePicker, { dateOnly: true, label: 'Draw date', input: { value: '2027-02-01 00:00:00', onChange: noop } }), ['February 01, 2027', 'Draw date']],
  ['inputs: TextArea', h(IN.TextArea, { label: 'Prize description', onChange: noop }), ['<textarea', 'Prize description']],
  ['inputs: FinalFormError', h(IN.FinalFormError, { meta: { error: 'Required' } }), ['rnc-field-error', 'Required']],
];
for (const [name, el, expect] of inputCases) {
  try { const html = render(el); const missing = expect.filter((s) => !html.includes(s)); check(name, !missing.length, missing.length ? 'missing ' + missing.join(', ') : ''); }
  catch (e) { check(name, false, e.message); }
}
check('inputs: Switch (MUI)', render(h(IN.Switch, { checked: true, onChange: noop, inputProps: { 'aria-label': 'Live' } })).includes('MuiSwitch-root'));
check('inputs entry exports', ['TextInput', 'DropdownInput', 'InputMasked', 'DatePicker', 'MaskedInput', 'TextArea', 'FinalFormError', 'BriefToolTip', 'TooltipBriefForm', 'DebouncingValidatingField', 'copyToClipboard', 'rncInputsTheme', 'Switch']
  .every((n) => IN[n] != null) && IN.DATEFORMAT_RAFFLE_NEXUS === 'YYYY-MM-DD HH:mm:ss');
// Tools that ignore "exports" (webpack 4, CRA 4, TypeScript moduleResolution "node") find /inputs through inputs/package.json and typesVersions.
const legacy = JSON.parse(readFileSync(join(root, 'inputs/package.json'), 'utf8'));
const pkgJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
// The /alerts entry (SweetAlert2). Opening a dialog needs a browser; here: it loads and exposes the app's API.
const AL = require('../dist/alerts.cjs');
check('alerts entry exports', typeof AL.SweetAlert === 'function' && AL.AlertBox === AL.SweetAlert
  && ['confirm', 'delete', 'success', 'error', 'info', 'custom', 'loading', 'close', 'update'].every((m) => typeof AL.SweetAlert[m] === 'function')
  && typeof AL.isSweetAlertOpen === 'function' && AL.isSweetAlertOpen() === false && typeof AL.configureSweetAlert === 'function');
const legacyAlerts = JSON.parse(readFileSync(join(root, 'alerts/package.json'), 'utf8'));
check('alerts/ fallback for older tools', ['main', 'module', 'types'].every((k) => statSync(join(root, 'alerts', legacyAlerts[k])).isFile())
  && require(join(root, 'alerts', legacyAlerts.main)).SweetAlert != null);
check('inputs/ fallback for older tools', ['main', 'module', 'types'].every((k) => statSync(join(root, 'inputs', legacy[k])).isFile())
  && require(join(root, 'inputs', legacy.main)).TextInput != null
  && pkgJson.files.includes('inputs') && pkgJson.files.includes('alerts') && pkgJson.typesVersions?.['*']?.inputs?.[0] === './dist/inputs.d.ts'
  && pkgJson.typesVersions?.['*']?.alerts?.[0] === './dist/alerts.d.ts');

// The /tables entry: the Raffle Builder's react-table v6 wrapper, rendered from both builds with v6 column definitions.
const TB = require('../dist/tables.cjs');
const tbHtml = render(h(TB.ReactTableComponent, { className: '-striped -highlight h-100', 'aria-label': 'App builds', data: [{ id: 7, created_by: { name: 'Ava Martin' } }], columns: [{ Header: 'Build', accessor: 'id', width: 90 }, { Header: 'Uploaded by', accessor: 'created_by.name', Cell: ({ value, original }) => h('b', null, value + ' #' + original.id) }, { Header: '', id: 'actions', sortable: false }] }));
check('tables: ReactTableComponent (CJS)', ['rnc-rt -striped -highlight h-100', 'role="table"', 'aria-label="App builds"', 'aria-sort="none"', '<b>Ava Martin #7</b>', 'max-width:90px'].every((x) => tbHtml.includes(x)), tbHtml.slice(0, 0));
check('tables: default export and empty text', TB.default === TB.ReactTableComponent && render(h(TB.ReactTableComponent, { data: [], columns: [{ Header: 'A', accessor: 'a' }] })).includes('No records available'));
const TBesm = await import('../dist/tables.js');
check('tables: ESM build', typeof TBesm.ReactTableComponent === 'object' || typeof TBesm.ReactTableComponent === 'function');
const legacyTables = JSON.parse(readFileSync(join(root, 'tables/package.json'), 'utf8'));
check('tables/ fallback for older tools', ['main', 'module', 'types'].every((k) => statSync(join(root, 'tables', legacyTables[k])).isFile())
  && require(join(root, 'tables', legacyTables.main)).ReactTableComponent != null
  && pkgJson.files.includes('tables') && pkgJson.typesVersions?.['*']?.tables?.[0] === './dist/tables.d.ts' && pkgJson.exports['./tables']?.require === './dist/tables.cjs');

// The package and its repository are public: no client names may appear in either.
// The names live in a git-ignored local file (see client-names.mjs), so this check runs on Marketing's machine.
const clients = clientNamePattern();
if (!clients) console.log("–    no client names: skipped (scripts/client-names.local.txt is only on Marketing's machine)");
else {
  const files = [];
  const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); } };
  walk(join(root, 'dist'));
  for (const d of ['src', 'styles', 'design', 'demo', 'scripts', '.github']) walk(join(root, d));
  for (const f of ['README.md', 'CHANGELOG.md', 'package.json', 'LICENSE']) files.push(join(root, f));
  const hits = [];
  for (const f of files.filter((f) => /\.(js|mjs|cjs|ts|cts|tsx|css|json|map|html|md|yml)$|LICENSE$/.test(f) && !f.includes('/demo/dist/'))) {
    const m = readFileSync(f, 'utf8').match(clients);
    if (m) hits.push(`${f.replace(root + '/', '')}: "${m[0]}"`);
  }
  check('no client names in the package or repository', !hits.length, hits.join('; '));
}
console.log(fails ? `\n${fails} check(s) failed` : '\nall checks passed');
process.exit(fails ? 1 : 0);
