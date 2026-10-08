# @rafflenexuscanada/design-system

React components, design tokens and fonts for Raffle Nexus Canada: the "Canada's raffle leader" direction (RNC V2.1). Flagship Navy colours, Newsreader headlines, DM Sans text and DM Mono figures.

The full design system, with page concepts, guidelines and assets, lives in the RNC V2.1 design-system artifact on claude.ai. This package holds the parts you build with.

> **Status: 0.3.1.** The brand direction is chosen by Marketing and pending sign-off from the CEO. Expect changes before 1.0.

## Install

```sh
npm install @rafflenexuscanada/design-system
```

React 17 or later is a peer dependency.

## Set up

Import the styles once, at the root of your app (for example `main.tsx`, or `app/layout.tsx` in Next.js):

```tsx
import '@rafflenexuscanada/design-system/styles.css'; // tokens + component styles
import '@rafflenexuscanada/design-system/fonts.css';  // self-hosted Newsreader, DM Sans, DM Mono (optional)
```

- `styles.css` includes `tokens.css`. If you only want the CSS variables, import `tokens.css` on its own.
- `fonts.css` serves the three typefaces from the package. Skip it if you already load them (for example from Google Fonts).
- Optionally add `className="rnc-root"` to `<body>` for the brand's page defaults (background, text colour, body size).
- The components are client components. The build starts with `'use client'`, so they work in the Next.js App Router.

```tsx
import { LeaderHero, TicketButton, JackpotTile } from '@rafflenexuscanada/design-system';

export function Hero() {
  return (
    <LeaderHero
      sub="The platform behind charity lotteries in five provinces."
      secondary={{ label: 'See the lotteries on our platform', href: '/lotteries' }}
      tiles={[{ program: 'Sample Hospital Lottery', amount: 2548700, province: 'BC', caption: 'As shown · 6 Oct 2026' }]}
    />
  );
}
```

## Components

> **Looking for `TextInput`, `DatePicker`, `InputMasked` or the other Raffle Builder inputs?** They're in a separate entry point, not this one: `import { TextInput } from '@rafflenexuscanada/design-system/inputs'`. See [Raffle Builder inputs](#raffle-builder-inputs-inputs). (`TextField` and `TextArea` below are the design system's simpler fields, with different props.)

| Component | What it's for | Key props |
| --- | --- | --- |
| `Button` | Actions. Sentence-case labels that say what happens. | `variant`: `primary`, `secondary`, `stage`, `stage-ghost`; `href` renders a link |
| `TicketButton` | The buy action, shaped like a ticket. The stub tilts on hover; a hole punches through on click. | `label`, `stub` ("from $10" or the order total), `size` (`big`), `fullWidth`, `colors` (client colours), `href` |
| `JackpotFigure` | Every jackpot figure: raised "$", tight tabular digits, perforation rule. | `amount`, `from` (counts up once from yesterday's figure), `growth`, `perforation` |
| `JackpotTile` | A live jackpot as proof. | `program`, `amount`, `from`, `province`, `live`, `caption` |
| `Odometer` | Rolling digits for real numbers (Raffle Insider and client raffle sites only). | `value`, `prefix`, `trigger` (`mount`, `visible`, `none`), `replayKey`, `onDone` |
| `ProofStat` | One proof figure per section. | `value`, `of`, `label`, `source` |
| `LedgerLine` | Labelled figures under one rule. | `items: { label, value, done? }[]` |
| `VerifiedBadge` | Licensed raffle, with the licence number. | `regulator`, `licence`, `title`, `rng`, `onStage` |
| `FlagshipRoster` | The lotteries on the platform, by province, without counts. | `groups: { province, items, empty? }[]`, `note` |
| `LeaderHero` | The claim and its proof on a stage band. | `headline`, `sub`, `primary`, `secondary`, `proof`, `tiles` |
| `RaffleBrand` | A client's raffle logo on its white-label site, with an optional sponsor. | `logo`, `sponsor` (`label`: "Sponsored by" / "Presented by"), `height`, `plate`, `strip` |
| `PoweredBy` | The only sign of Raffle Nexus on a client's site (footer and checkout). | `href`, `onStage` |
| `NodeGraphic` | The logo's node shapes as large graphic elements. | `name` (`link`, `triad`, `link-tall`, `link-wide`), `size`, `color`, `shadow` |
| `Icon` | Phosphor icons (regular weight) that take the text colour. | `name` (see `ICON_NAMES`), `size`, `label` |
| `TextField`, `TextArea` | Labelled text inputs. Hint and error are tied to the field (`aria-describedby`); an error sets `aria-invalid`. Refs pass through, so form libraries work. | `label`, `hint`, `error`, `optional`, plus any input props (`type`, `autoComplete`, `value`…) |
| `Select` | A labelled native select with a chevron (works with every keyboard, screen reader and phone picker). | `label`, `options` (or `<option>` children), `placeholder`, `hint`, `error` |
| `Checkbox` | A 24px checkbox with its label to the right. | `label`, `hint`, `error`, plus input props |
| `RadioGroup` | Radios in a fieldset with a legend. | `legend`, `name`, `options`, `value`/`defaultValue`, `onChange`, `hint`, `error` |
| `Switch` | On/off for settings that apply straight away. Use a Checkbox in a submitted form. | `label`, `checked`, `onChange`, `disabled` |
| `ErrorSummary` | Shown after a failed submit: takes focus and links to each field with a problem. | `errors: { fieldId, message }[]`, `title`, `autoFocus` |
| `Dropdown` | A button that opens a short menu of actions or links (arrow keys, Home/End, Escape, click outside). For a form choice, use Select. | `label`, `items: { label, href?, onSelect?, icon?, disabled? }[]`, `variant`, `align` |
| `Sidebar` | An app's main navigation: logo on top, one icon per menu item, optional headed groups, collapsible to icons only. Works with your router's link component. | `logo`, `logoCollapsed`, `items` or `sections`, each item `{ label, href?, icon?, current?, badge?, onClick? }`, `collapsed`, `footer`, `linkComponent` |
| `Offcanvas` | A panel that slides in from an edge (a modal dialog). Focus moves in and stays, the page doesn't scroll, Escape or a backdrop click closes it, focus returns afterwards. | `open`, `onClose`, `side` (`left`, `right`, `top`, `bottom`), `title`, `size`, `flush`, `closeOnBackdrop`, `closeOnEscape` |
| `Table` | Data rows with TanStack Table (react-table) behaviour: pass `columns` and `data`; get sorting, search, row selection and pages. | `data`, `columns` (TanStack `ColumnDef`; `meta: { numeric: true }` right-aligns figures), `caption`, `searchable`, `pageSize`, `enableRowSelection`, `onRowSelectionChange`, `getRowId` |

Every component has TypeScript types with notes on each prop. Your editor shows them as you type.

## Raffle Builder inputs (`/inputs`)

A second entry point, `@rafflenexuscanada/design-system/inputs`, holds the Raffle Builder's form inputs: MUI fields for react-final-form, rebuilt from the app's `src/js/shared/` files **with the same props, names and defaults**, in the design system's look (the `BriefFormInputs` card). The main entry doesn't use MUI; only this one does.

Install the peer dependencies (the app already has most of them):

```sh
npm install @mui/material @emotion/react @emotion/styled @mui/x-date-pickers moment react-final-form final-form react-hot-toast @react-input/mask
```

Import `styles.css` once (as above) and keep react-hot-toast's `<Toaster />` in the app: review mode shows its "Copied!" toast there.

**Swapping them in without touching the brief form.** Replace the body of each file in `src/js/shared/` with a re-export, and every call site keeps working as written:

```js
// src/js/shared/TextInput.jsx
export { TextInput as default } from '@rafflenexuscanada/design-system/inputs';
// src/js/shared/InputMasked.jsx (a named export in the app)
export { InputMasked } from '@rafflenexuscanada/design-system/inputs';
// src/js/shared/TooltipBriefForm.jsx
export { BriefToolTip as default } from '@rafflenexuscanada/design-system/inputs';
```

| Component | What it's for | Props (as in the app) |
| --- | --- | --- |
| `TextInput` | The hub: text, password, number, or a searchable dropdown (`type="dropdown"` renders `DropdownInput`). Spread the Field's `input` onto it. Forwards its ref to the `<input>`. | `disabled`, `disabledAll`, `value`, `label`, `error`, `type`, `helperText`, `input`, `decimal`, `min`, `max`, `options`, `meta`, `tooltip`, `placeholder`, `showPasswordToggle`, `...rest` to MUI `TextField` |
| `DropdownInput` | MUI Autocomplete. The form value is the chosen option's `value`. | `disabled`, `disabledAll`, `value`, `input`, `options: { label, value }[]`, `meta`, `label`, `error`, `...rest` to `Autocomplete` (plus optional `helperText`, `tooltip`) |
| `InputMasked` (named export) | Prefix and/or suffix inside the field ("https://", "$", "%"); spaces are removed. No `...rest`. | `input`, `label`, `maxLength`, `helperText`, `error`, `meta`, `pre`, `post`, `tooltip`, `disabled`, `disabledAll` |
| `DatePicker` | MUI X date or date-time picker on moment. Stores `YYYY-MM-DD 00:00:00` (date only) or `DATEFORMAT_RAFFLE_NEXUS`. | `dateOnly`, `input`, `helperText`, `hideHelperText`, `label`, `meta`, `disabled`, `disableDates`, `small`, `tooltip`, `...props` to the picker |
| `MaskedInput` | A masked field (`@react-input/mask`), rendered by TextInput. | `maskOptions`, `input`, `meta`, `placeholder`, `error`, `tooltip`, `label`, `disabledAll`, `disabled` |
| `TextArea` | Multi-line counterpart to TextInput (unused in the app today). | `disabled`, `value`, `label`, `error`, `input`, `...rest` to MUI `TextField` |
| `FinalFormError` | A field's validation message. | `meta`, `notTouched`, `inline` |
| `BriefToolTip` (also `TooltipBriefForm`) | An info button that opens a tooltip; for headings. | `title`, `children`, `style` |
| `DebouncingValidatingField` | A `<Field>` whose validation waits until typing stops. | `debounce` (500) + every `<Field>` prop |

Also exported: `copyToClipboard(text)`, `DATEFORMAT_RAFFLE_NEXUS` (`'YYYY-MM-DD HH:mm:ss'`), and `rncInputsTheme` / `RncInputsTheme` (the MUI theme the inputs wrap themselves in, for other MUI parts of the app).

**`disabledAll` is review mode, not `disabled`.** The value is locked but stays in full ink, and a click copies it (Clipboard API, `execCommand('copy')` fallback) with a "Copied!" toast. Dropdowns copy the option's label; InputMasked copies prefix + value + suffix; DatePicker copies in SQL format and does this when `disabled` (it has no `disabledAll`).

**Where the rebuild differs from the app's files** (props are unchanged; raise anything that should go back):

- Labels sit above the field (the design system's rule) instead of floating inside it, and the info button sits beside the label instead of inside the field. It's a real button ("About Support Email") that opens on hover, focus or tap.
- Icons are the design system's Phosphor set (info, eye, calendar) instead of react-feather and MUI icons; `styled-components`, `react-feather`, `@mui/icons-material`, `framer-motion` (imported but unused), `prop-types`, `@mui/base` and `@mui/system` are no longer needed.
- Dropdown: clearing it stores `null` instead of throwing (`newValue.value` on `null`); its error now follows the `error` prop or `meta`, and doesn't crash without `meta`; `helperText` shows under it (the app passed it to Autocomplete, which ignored it); its id is stable instead of random on every render.
- Number fields: a wheel scroll over a focused field blurs it instead of calling `preventDefault()`, which React's passive wheel listeners ignore. The ref is forwarded for number fields too.
- TextInput and TextArea fall back to `input.onChange` when no `onChange` is spread in.
- DatePicker: restores the page's previous scroll style when it closes (the app forced `overflow: auto`); a `small` picker keeps its label for screen readers; the unused anchor element is gone.
- TextArea is an MUI multiline field (from 4 rows) with a visible label; the app's version passed `label` and `error` to a bare textarea, where they did nothing. The "Empty" placeholder is gone.
- FinalFormError keeps its `error inline` / `error d-block` classes and adds the design system's error style.

**Kept as the app ships them, worth a look:**

- `DATEFORMAT_RAFFLE_NEXUS` came from the app's `./utils`, which wasn't in the handoff. It's set to `'YYYY-MM-DD HH:mm:ss'`; confirm it matches.
- InputMasked ignores its `error` prop and shows `meta.error` straight away, before the field is touched. With a `post` suffix, typing stops one character before `maxLength`; without one, `maxLength` does nothing.
- Number fields with `decimal` send `"NaN"` when emptied (`parseFloat('').toFixed(2)`).
- Date-only pickers show the error in place of the label.
- MaskedInput passes `overwrite: true`, which `@react-input/mask` 2.x doesn't have, and its `_` pattern accepts `-` and `.`, which phone masks also use as literals, so editing an already-filled phone number can shift digits.
- The dropdown's `autoComplete="off"` turns MUI's inline completion **on** (MUI reads any string as true).
- Not ported: `ReactSelectAdapter`, `ReactPhoneNumberAdapter` (unused) and `NumberPicker` (a stub). A stepper should be designed rather than ported.

The ES module build is for bundlers (webpack, Vite, Next.js): MUI 5's subpath imports don't load in plain Node ESM. The CommonJS build works in Node and Jest. Older tools that ignore package.json `exports` (webpack 4, Create React App 4, older Jest, TypeScript with `"moduleResolution": "node"`) find `/inputs` too, through the package's `inputs/` folder and `typesVersions` (0.3.1 and later).

### Examples

```tsx
// On a client's raffle site, in the client's colours
<TicketButton label="Order tickets" stub="from $10" href="/checkout" colors={{ bg: '#0b5e7a', stub: '#083f52' }} />

// A jackpot that counts up once from yesterday's figure
<div style={{ fontSize: 64, color: 'var(--reward)' }}>
  <JackpotFigure amount={684270} from={671790} growth="Up $12,480 since yesterday" />
</div>

// A drawn number that rolls in when it scrolls into view
<Odometer value="0428713" trigger="visible" />

<VerifiedBadge regulator="IGCO" licence="171012" />
```

## Tokens

All colours, spacing, radii, shadows and font stacks are CSS custom properties on `:root`:

```css
.card { background: var(--surface); color: var(--ink-body); border-radius: var(--radius-lg); box-shadow: var(--shadow-1); padding: var(--space-5); }
```

Type styles are classes: `rnc-display`, `rnc-h2`, `rnc-h3`, `rnc-lede`, `rnc-body`, `rnc-small`, `rnc-button`, `rnc-label`, `rnc-figure`, `rnc-figure-lg`, `rnc-licence`. For headlines, `rnc-h` sets the Newsreader headline style; add a size class or your own `font-size`.

The same values are available in JavaScript (`import { tokens } from '@rafflenexuscanada/design-system'`) and as JSON (`@rafflenexuscanada/design-system/tokens.json`).

| Colour | Job |
| --- | --- |
| `ground`, `surface`, `surface-tint` | Page and panel backgrounds |
| `ink`, `ink-body`, `ink-muted` | Headlines, running text, captions |
| `action`, `on-action` | Primary buttons and links |
| `stage`, `on-stage`, `stage-accent` … | Dark bands (heroes, proof, footer) |
| `lead`, `lead-fill`, `lead-soft` | The leadership mark and proof figures |
| `reward` … | Prize and jackpot figures only |
| `verified` … | Licensed, confirmed and reconciled only |
| `error`, `error-soft` | Form errors only, always with words and an icon |

## Brand rules that affect code

- **Serif for h1 and h2 only.** Newsreader (`rnc-h`, `rnc-display`, `rnc-h2`) is for h1 and h2. Everything else, including h3 (`rnc-h3`), card titles, quotes and labels, is DM Sans; figures are DM Mono.
- **Real figures only.** Jackpots, counts and drawn numbers come from the platform. Label our own counts with a source and date (`ProofStat` `source`).
- **Excitement with guardrails.** `Odometer`, `TicketButton` effects and count-ups belong on Raffle Insider and client raffle sites. The organizations side stays calm: one jackpot count-up at most. No reels, near-miss effects, repeat-buy prompts or urgency beyond real deadlines.
- **Client names need permission.** Pass program names in as props, and only once the client has approved public use. The package itself contains no client names.
- **Client sites wear the client's brand.** Use `RaffleBrand` for their logo and `TicketButton colors` for their palette. `PoweredBy` is the only Raffle Nexus mark there, and `NodeGraphic` never appears on client sites.
- **Accessibility.** Every animation stops under `prefers-reduced-motion`, and animated figures expose their real value to screen readers. Keep text at 12px or larger, targets at 24px or larger, and visible focus rings.

## Develop

```sh
npm install
npm run dev        # demo page with every component, live from src/
npm test           # unit tests, then build, then smoke tests on the built package
npm run test:watch # unit tests, re-run as you edit
npm run build      # dist/: ESM, CommonJS, types, CSS, fonts, tokens.json
```

**Tests run before every release.** GitHub Actions runs `npm test` on every pull request and before every publish; if anything fails, nothing is published.

- **Unit tests** (`tests/`, Vitest + Testing Library in jsdom) check behaviour the way people use it: labels and errors are announced with their fields, the dropdown works by keyboard (arrows, Home/End, Escape returns focus) and closes on an outside click, the switch flips, the error summary takes focus and its links move to the field, jackpots read as the whole amount and count up once, and every animation stops under reduced motion. The Raffle Builder inputs are tested at a react-final-form call site written like the app's (`{...input}` spread, `meta`, `error`, `tooltip`, `disabledAll`): typing reaches the form, errors appear once touched, the dropdown stores the option's value, review mode copies (with the `execCommand` fallback), dates copy in SQL format and pasted date-times are stored.
- **Smoke tests** (`scripts/smoke-test.mjs`) render every component from the built ES module and CommonJS files and, on Marketing's machine, check no client names appear anywhere.

Add a unit test with every new component or behaviour change.

`design/tokens.json`, `design/icons.json` and `design/nodes.json` are copies of the design system's files. When the design system changes, replace them and run `npm run generate` (the build does this too). Don't edit `styles/tokens.css` or `src/generated/` by hand.

## Automatic releases

The design system is the source of truth. When Marketing changes it, this package follows, and nothing goes out until someone has looked at it:

1. Marketing updates the RNC V2.1 design system.
2. `npm run sync` (run on Marketing's machine, automatically after each design-system publish) copies the new tokens, icons, node shapes and component styles in, rebuilds, runs the tests, bumps the patch version, adds a changelog line and commits. It doesn't push.
3. `npm run preview` builds the demo page from the local package, lists the commits and files that aren't on GitHub yet, and opens the demo at http://localhost:4180. Nothing is pushed or published.
4. When it looks right, `npm run release` runs the tests again and pushes `main` to GitHub.
5. GitHub Actions (`.github/workflows/release.yml`) type-checks, tests and publishes the new version to npm, then tags it. `ci.yml` tests pull requests. npmjs.com shows a new version as "validating" for a few minutes while it checks the provenance signature; it can already be installed.

New components and changes to how a component behaves are code. They're ported into `src/` by hand in the same change, and released as a minor version (`npm run sync -- --minor`).

`npm run status` checks every link (design system → package → GitHub → npm) and says what to fix if one is out of sync.

**Setup (done 2026-10-07)**
- This repo is on GitHub, and Marketing can push to `main`. `repository.url` in `package.json` points at it.
- On npmjs.com, the package's **Settings › Trusted Publisher** trusts GitHub Actions with this repository and the workflow file `release.yml`, so no password is stored. Its **Allowed actions** must include publishing: npm's default allows only staged publishing, and a plain publish then fails with `E403 OIDC permission denied for this action`. (Alternative: save an npm automation token as the repository secret `NPM_TOKEN`.)

Every push to `main` with a new version publishes it.

**Client names.** The repository is public, so client and program names must never appear in it. The list the tests and the sync check against lives in `scripts/client-names.local.txt`, which git ignores; it exists only on Marketing's machine, and the check is skipped elsewhere.

## Getting updates automatically (apps that use this package)

Automatic releases are patch versions (0.1.1, 0.1.2…), so `npm update @rafflenexuscanada/design-system` picks them up. To have them arrive as pull requests without anyone remembering, add Dependabot to the app's GitHub repository, in `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: daily
    allow:
      - dependency-name: "@rafflenexuscanada/design-system"
```

## Publish by hand

1. Sign in with the company npm account: `npm login`.
2. Bump the version (`npm version patch` for fixes, `minor` for new components, `major` for breaking changes) and add a line to `CHANGELOG.md`.
3. `npm publish`. It runs the type check and tests first and publishes publicly (`publishConfig.access`).

The package is published as `@rafflenexuscanada/design-system`, in the company's `rafflenexuscanada` npm organisation.

## Licence

Copyright Raffle Nexus Canada. See [LICENSE](./LICENSE). The Raffle Nexus name, logo and node shapes are trademarks of Raffle Nexus Canada. Icons are from Phosphor Icons (MIT). Fonts are under the SIL Open Font License 1.1 (licence files in `dist/fonts`).
