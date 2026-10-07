# Changelog

## 0.2.0 (2026-10-07)

- New form elements: `TextField`, `TextArea`, `Select`, `Checkbox`, `RadioGroup`, `Switch` and `ErrorSummary`, with labels, hints and errors tied to each field.
- New `Dropdown`: a menu button for actions or links, fully keyboard-operable.
- New `Sidebar`: logo on top, one icon per menu item, headed groups, collapsible, router-link friendly.
- New `Offcanvas`: a modal panel that slides in from any edge, with focus kept inside and returned on close.
- New `Table`: TanStack Table (react-table) behaviour with `columns` and `data` props: sorting, search, row selection and pages. `createColumnHelper` and `ColumnDef` are re-exported.
- Icons: added `x` (close) and `list` (menu).
- Unit tests (Vitest + Testing Library) for every component's behaviour; `npm test` runs them before every release.
- Released automatically from GitHub (anubir-raffle/rafflenexus-ui) with npm Trusted Publishing and provenance; the npm page links to the repository.
- `ErrorSummary` focuses the field safely where `scrollIntoView` isn't available.

(0.1.1 was prepared but never published; its changes are part of 0.2.0.)

## 0.1.0 (2026-10-07)

First release, from the RNC V2.1 design system ("Canada's raffle leader").

- Tokens: Flagship Navy colours, spacing, radii, shadows and font stacks as CSS variables, JavaScript and JSON; type-style classes.
- Components: Button, TicketButton, JackpotFigure, JackpotTile, Odometer, ProofStat, LedgerLine, VerifiedBadge, FlagshipRoster, LeaderHero, RaffleBrand, PoweredBy, NodeGraphic, Icon.
- Self-hosted fonts (Newsreader, DM Sans, DM Mono) in `fonts.css`.
- Demo page (`npm run dev`) and smoke tests (`npm test`).
