# Changelog

## 0.7.0 (2026-10-16)

The Raffle Builder's setup form wizard, plus the 0.6.x fixes.

- New entry point `@rafflenexuscanada/design-system/wizard`: `Wizard` and `Wizard.Page` on react-final-form with the app's props and behaviour (per-step validation, step bar with complete / not complete / Review, Review locked until every step is valid, Next that never blocks, autosave through `onSave`, QA mode with Complete form, read-only with no submit), and new optional `label`, `review`, `mutators`, `header`, `notice`, label overrides, `onReviewBlocked` and `isSubmitBlocked`. Parts: `WizardHeader`, `WizardDeadline`, `WizardSection`, `WizardSteps`. Older tools find it too (a `wizard/` folder and `typesVersions`). The design system's `Wizard` card.
- `layout="v2"`: the Raffle Builder layout of RNC V2.1 (top bar, rail with progress, step summaries and QA checks, step title and intro, sections on panels, a live site preview beside Website, sticky footer). Fluid, with container queries. New props `toolbar`, `aside`, `preview`, `railLabel`; pages add `summary` and `description`; parts `WizardToolbar`, `WizardPreview`, `WizardSitePreview`.
- Builder parts in the main entry: `AnimatedList` (added items grow in, removed ones fold away, the rest glide), `SortableList` (drag by a grip or Move earlier / later, announced, Escape cancels), `ExpandableRow`, `UploadTile` (choose or drop, size checks in words, Replace and Remove); and `WizardReview` in `/wizard`.
- Wizard motion: step content slides in by direction with sections following, the V2 rail's card glides to the current step, step circles pop when a step completes or Review unlocks, the save status fades. All off under reduced motion.
- The Wizard keeps fields registered across steps, so react-final-form 7 no longer resets a remounted field to its initial value.
- Live preview of the real site: `WizardPreview` lays the site out at 1280 or 390 wide and scales it to fit, with a Desktop / Mobile switch (`device`, `defaultDevice`, `onDeviceChange`, `devices`); `WizardSitePreview` draws the standard raffle site (header, hero with slides, Choose a pack, Important dates, Prizes, Where the money goes, footer) for either device, with new props `logo`, `slides`, `packs`, `dates`, `prizes`, `licence`. `usePreviewDevice` for your own preview.
- Step bar on phones: fades and arrows where there are more steps, mouse drag, the current step centred.
- `BrandColours` (main entry): primary, secondary and accent picked from the logo (`pickBrandColours`, `extractBrandColours`), each adjustable with a picker or hex value, with readable text shown (`readableOn`, `contrastRatio`). `WizardSitePreview` takes `secondary` and a `badge` (the licensed-raffle VerifiedBadge above the footer); the preview's note says the live site may look a little different.
- Phones: sortable rows keep their handles on one line with the field underneath; expandable rows let the title wrap with its value under it and move their buttons to a line of their own when tight; a field's count moves under a long error. The preview no longer puts the first slide, cropped, behind the hero (`background` takes the client's own hero image).
- Invalid fields show one outline: the web address no longer draws a second red border inside its frame, and a field being typed in shows only the focus ring (the red border returns on leaving it; the message stays).
- V2 panels: the title and intro sit on a tinted band, ruled off from the fields, with more room below it. V1 is up to 64rem wide, centred.
- New fields in the main entry: `RichTextArea` (bold, italic, lists; clean HTML; `RichText`, `sanitizeRichText`, `richTextLength`, `richTextToPlain`), `DomainField` (Raffle Nexus address or own domain, `rn` / `own`, `domainUrl`; up to 36rem wide; a 63 / 253 character limit with a count), `SegmentedControl`, `CopyButton` and `copyText`.
- `maxLength` with a characters-left count on `TextField`, `TextArea`, `RichTextArea` and `/inputs` `TextInput` and `TextArea` (`showCount={false}` hides it).
- `review` on `TextField`, `TextArea`, `RichTextArea` and `DomainField`: read-only with a Copy button inside. `/inputs` fields in review mode (and a disabled `DatePicker`) get the Copy button too; `/inputs` `TextArea` takes `disabledAll`.
- Upload tiles side by side line up (label, hint, tile and message share rows). List animations measure inside each list, so nested lists stay still. The dropdown button no longer lifts on click and its menu fades in; the `/inputs` dropdown list fades in too.
- `final-form-arrays` (3 or 4) is an optional peer dependency, needed only for `/wizard`.
- Icons: added `check`, `dots-six-vertical`, `trash`, `arrow-up`, `arrow-down`, `image`, `text-b`, `text-italic`, `list-numbers` and `monitor` (66).
- Includes the design-system syncs 0.6.5 to 0.6.13 (the Wizard's styles), which weren't published on their own.

## 0.6.5 (2026-10-15)

- Synced with the design system. Updated: icons, component styles.

## 0.6.4 (2026-10-15)

- Fixed: headings and text inside a stage band (`rnc-stage`) now stay white in apps that set their own colour on `h1`–`h6` or `p` (they used to inherit the colour, which an app rule beats). Component rules inside a band still set their own colours.
- Icons: added `magnifying-glass`, `lock-simple`, `calendar-plus`, `book-open-text`, `clipboard-text`, `monitor-play`, `heartbeat`, `paw-print`, `palette`, `car`, `airplane-tilt`, `bank`, `calculator`, `download-simple`, `share-network`, `squares-four` and `list-bullets` (56 in all), so every action has an icon that means it. The design system's Assets › Icons lists what each one is for.
- Demo and README: the sample Raffle Builder menu uses `clipboard-text` for setup forms, `book-open-text` for rules of play and `monitor-play` for Reveal; downloads use `download-simple`.
- Includes 0.6.1–0.6.3 (the same syncs, in steps), which weren't published on their own.

## 0.6.0 (2026-10-14)

The third Raffle Builder handoff: status pills, filter chips and the step timeline.

- New `StatusPill`: where a record stands, in a word. Tones `neutral`, `progress`, `review`, `success` and `error`; an optional icon or dot; a figure in the mono face (`value="44%"`); sizes `md` 28px and `sm` 24px. The `StatusPill` card.
- New `FilterChip` and `FilterChipGroup`: the filters in force, each removable (named "Remove filter: Status: In progress"), then "Clear all". After a removal, focus moves to the next chip, or to `returnFocusRef` when none are left, and the removal is announced. A chip without `onRemove` is fixed (grey, no ×). The `FilterChips` card.
- New `StepTimeline` and `StepTimelineLabels`: a record's steps on one line with dates under them (done, late, up next, not set), states worked out from the dates unless passed; step names once in a table header on the same tracks. An ordered list; each step reads in full to screen readers. The `StepTimeline` card.
- Includes 0.5.1 (synced styles), which wasn't published on its own.

## 0.5.1 (2026-10-14)

- Synced with the design system. Updated: component styles.

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
