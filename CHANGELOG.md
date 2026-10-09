# Changelog

## 0.5.0 (2026-10-09)

The second Raffle Builder handoff (Table, Avatar, Button, Sidebar), plus the MUI Switch.

- New entry point `@rafflenexuscanada/design-system/tables`: `ReactTableComponent`, a drop-in for the Raffle Builder's react-table v6 wrapper (same props, v6 column definitions with dotted accessors, `getTrProps`, infinite scroll at 60% with a 150ms settle, fixed header, `-striped` / `-highlight` / `h-100`), built on TanStack Table. Also the default export. Older tools find it too (a `tables/` folder and `typesVersions`). The `ScrollTable` card.
- `Button` grew into the full component: variants `ghost`, `link`, `danger`, `danger-ghost` (plus `primary`, `secondary`, `stage`, `stage-ghost`), `size` (`sm`, `md`, `lg`), `startIcon` / `endIcon`, `iconOnly`, `loading` / `loadingText` (spinner in the icon slot, clicks ignored, focus kept, width held), `fullWidth`, `as`, `target` / `rel`, and a forwarded `ref`. A disabled or loading link drops its `href`. Existing props work as before.
- New `Avatar` and `AvatarGroup` (MUI-style `alt`, `src`, `srcSet`, `variant`, `children`; sizes `xs`–`xl` or pixels; optional `name` and `subtitle`; initials on a colour fixed to the name; a person icon; the `Avatar` card).
- `Sidebar` additions: a collapse button (`onCollapsedChange`, `showCollapseToggle`), `primaryAction`, `footer` as a function of `{ collapsed }`, items with `description`, `external` and `target`, a phone drawer below 980px (`mobileOpen`, `onMobileOpenChange`, `mobileBreakpoint`), tooltips for collapsed items on hover and keyboard focus (replacing the native `title`), and a dot for badges when collapsed. Existing props work as before.
- `Switch` in `/inputs`: MUI's Switch with the same props, in the design system's look.
- Fixed: `InputMasked`'s hidden measuring element could widen the page on phones (sideways scrolling); it's now zero-sized.
- `npm run preview` always restarts its server, so it never shows another checkout's build.
- Icons: added `user`, `plus`, `upload-simple`, `arrow-square-out`, `caret-left` and `caret-right` (39 in all).
- Includes 0.4.1 (synced styles), which wasn't published on its own.

## 0.4.1 (2026-10-09)

- Synced with the design system. Updated: icons, component styles.

## 0.4.0 (2026-10-08)

- New entry point `@rafflenexuscanada/design-system/alerts`: the Raffle Builder's `SweetAlert` helper (SweetAlert2) with its existing API, in the design system's look (the `AlertBox` card). `SweetAlert.confirm`, `.delete`, `.success`, `.error`, `.info`, `.custom`, `.loading`, `.close`, `.update`, `isSweetAlertOpen()`, the "Don't show this again" checkbox, and `AlertBox` as another name. The app passes its `saveUserSettings` and `pushEscapeLayer` once with `configureSweetAlert`. Older tools find `/alerts` too (an `alerts/` folder and `typesVersions`).
- `sweetalert2` and `sweetalert2-react-content` are optional peer dependencies, needed only for `/alerts`.
- Styles from the design system's new `AlertBox` card, including `rnc-btn-danger` (delete confirmations only). Icons: added `warning`, `check-circle` and `x-circle`.
- Also contains 0.3.3, which was prepared but not published: `InputMasked`'s layout holds against `!important` app-wide CSS (field padding, input background, prefix/suffix spacing and font), and the gap after a prefix is 4px (a suffix keeps 8px).
- 14 new unit tests (97 in all) and smoke tests for the `/alerts` build.

## 0.3.3 (2026-10-08, not published; part of 0.4.0)

- `InputMasked` holds its layout even against `!important` app-wide CSS. In the Raffle Builder, the prefix still sat flush against the field's edge after 0.3.2, so the field padding, the input's transparent background and the prefix/suffix spacing and font are now `!important` as well as high-specificity (tested against `!important` rules that zero the padding, paint the input white and bold the affixes).
- Tighter after the prefix: 4px between "https://" and the value (was 8px), so the URL reads as one. The suffix keeps 8px. Same in the design system's `BriefFormInputs` card.

## 0.3.2 (2026-10-08)

- `InputMasked` holds its look inside apps with their own global CSS. Reported in the Raffle Builder: the prefix sat flush against the field's edge, the prefix and suffix turned bold grey, and a disabled or review-mode field showed the value as a white box (an app-wide `input:disabled` background). The prefix and suffix are now plain text (not MUI's `<p>`), and the field's padding, input background and affix styles use selectors that outrank one-class app rules.
- More space between the value and its prefix or suffix: 8px (was 6px). Same in the design system's `BriefFormInputs` card.

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
