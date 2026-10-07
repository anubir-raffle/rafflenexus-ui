# @rafflenexuscanada/design-system

React components, design tokens and fonts for Raffle Nexus Canada: the "Canada's raffle leader" direction (RNC V2.1). Flagship Navy colours, Newsreader headlines, DM Sans text and DM Mono figures.

The full design system, with page concepts, guidelines and assets, lives in the RNC V2.1 design-system artifact on claude.ai. This package holds the parts you build with.

> **Status: 0.1.0.** The brand direction is chosen by Marketing and pending sign-off from the CEO. Expect changes before 1.0.

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

Every component has TypeScript types with notes on each prop. Your editor shows them as you type.

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
npm test           # builds, renders every component, checks no client names ship
npm run build      # dist/: ESM, CommonJS, types, CSS, fonts, tokens.json
```

`design/tokens.json`, `design/icons.json` and `design/nodes.json` are copies of the design system's files. When the design system changes, replace them and run `npm run generate` (the build does this too). Don't edit `styles/tokens.css` or `src/generated/` by hand.

## Automatic releases

The design system is the source of truth. When Marketing changes it, this package follows without anyone publishing by hand:

1. Marketing updates the RNC V2.1 design system.
2. `npm run sync` (run on Marketing's machine, automatically after each design-system publish) copies the new tokens, icons, node shapes and component styles in, rebuilds, runs the tests, bumps the patch version, adds a changelog line, commits and pushes to `main`.
3. GitHub Actions (`.github/workflows/release.yml`) type-checks, tests and publishes the new version to npm, then tags it. `ci.yml` tests pull requests.

New components and changes to how a component behaves are code. They're ported into `src/` by hand in the same change, and released as a minor version (`npm run sync -- --minor`).

`npm run status` checks every link (design system → package → GitHub → npm) and says what to fix if one is out of sync.

**One-time setup**
1. Push this repo to the public GitHub repository and give Marketing write access, so the sync can push to `main`. Set `repository.url` in `package.json` to the repository's address.
2. Version 0.1.0 is already on npm (published 2026-10-07), so there's no hand publish to do.
3. On npmjs.com, open the package's **Settings › Trusted Publisher** and add GitHub Actions with this repository and the workflow file `release.yml`. GitHub then publishes with no stored password. (Alternative: save an npm automation token as the repository secret `NPM_TOKEN`.)

From then on, every push to `main` with a new version publishes it.

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
