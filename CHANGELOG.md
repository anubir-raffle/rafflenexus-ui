# Changelog

## 0.3.1 (2026-10-08)

- `@rafflenexuscanada/design-system/inputs` now resolves in tools that ignore package.json `exports` (webpack 4, Create React App 4, older Jest, TypeScript with `"moduleResolution": "node"`), through an `inputs/` folder and `typesVersions`. In 0.3.0 those reported "Cannot find module '@rafflenexuscanada/design-system/inputs'".
- More room around icons and affixes in the inputs: show-password and calendar buttons sit 16px from the field's edge (was about 6–10px), and prefixes and suffixes ("https://", "%") sit 6px from the value (was 2px). Same in the design system's `BriefFormInputs` card.
- README: a pointer to `/inputs` at the top of the component list, for anyone looking for `TextInput` in the main entry.

## 0.3.0 (2026-10-08)

- New entry point `@rafflenexuscanada/design-system/inputs`: the Raffle Builder's form inputs rebuilt from the app's `src/js/shared/` files with the same props and defaults: `TextInput` (text, password, number, dropdown), `DropdownInput`, `InputMasked`, `DatePicker`, `MaskedInput`, `TextArea`, `FinalFormError`, `BriefToolTip` (`TooltipBriefForm`) and `DebouncingValidatingField`, plus `copyToClipboard`, `DATEFORMAT_RAFFLE_NEXUS` and the MUI theme `rncInputsTheme`. MUI fields for react-final-form in the design system's look, with review mode (`disabledAll`: click to copy, "Copied!" toast). See the README for the differences from the app's files and the points to confirm.
- MUI, Emotion, MUI X Date Pickers, moment, react-final-form, final-form, react-hot-toast and @react-input/mask are optional peer dependencies, needed only for `/inputs`. The main entry is unchanged and MUI-free.
- Styles from the design system's new `BriefFormInputs` card: label row with an info button, tooltip panel, prefix/suffix fields, combobox list and review mode.
- Icons: added `info`, `eye`, `eye-slash` and `copy`.
- 31 new unit tests (82 in all) and smoke tests for the `/inputs` CommonJS build.

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
