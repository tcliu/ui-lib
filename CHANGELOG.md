# Changelog

All notable changes to this package are documented here. Each published
version has one section, newest first; the format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.2] - 2026-11-21

### Added

- `NumberInput` accelerates its step on a modifier: Alt or Shift with
  ArrowUp/Down, the wheel, or a stepper click moves `step × 10` at once, and
  both modifiers move `step × 100`, keeping the same clamp, snapping, and
  written decimals as a single step. A shifted wheel arrives as a horizontal
  delta, so the focused field reads that axis instead of scrolling the page
  sideways.

### Changed

- `NumberInput`'s stepper chevrons shrink by 20% (`stepperIcon` `0.75` → `0.6`,
  9.6px in the md stepper slot), so they read lighter beside the value while
  the gutter, radius, and button boxes stay unchanged.

## [0.4.1] - 2026-11-20

### Added

- `ClearButton`: the standalone clear affordance, sharing the clearable
  field's trimmed cross (`0.625×` of the size axis) and reserved pointer box
  (`1×`), with a localized “Clear” accessible name and optional `size`,
  `disabled`, and `tooltip` props.
- `DataTable` column filters: `columnFilters` adds a funnel trigger to every
  `filterable` column's header, opening a portalled panel with a free-text
  autocomplete of that column's values (`filterOptions` overrides them).
  `filters` is bindable and `onFilter` reports every change, so a remote table
  filters server-side while a table that owns its full rows filters locally; a
  `ClearButton` beside the search box clears them all.
- `DataTable`'s sort arrows stay visible at rest, so the active direction reads
  without hovering, and the column-filter funnel rides right beside them.
- `FilterIcon` gains a `sheets` variant — three decreasing bars, the lighter
  spreadsheet-style filter mark the table header uses; `regular` stays the solid
  funnel. A filtered column keeps the bar mark, switching it to the accent ink
  with a small dot badge, so the glyph's shape never changes with state.
- `createTableModel` takes `initialFilters` and exposes `filters`,
  `setFilter`, `clearFilters`, `activeFilterCount`, and `allRows`; column
  filters run ahead of the search in the filter → sort → page pipeline.
- `DataTable` keeps loaded rows visible while `loading`, setting `aria-busy`
  and overlaying a spinner, and clamps an out-of-range `currentPage` by
  reporting `onPageChange(totalPages)` once when a remote total shrinks.
- `AutoComplete` reports its live text through `onInput` (typing, clearing, or
  an option pick), beside `onSelect`.

### Changed

- `Button` takes the text field's text metrics — font, radius, line box, and
  vertical padding — so one size step gives the same label size and the same
  outer box across controls: the label is the field's `0.875` ratio (14px at
  `md`) instead of the compact `0.8125`. The glyph keeps the shared icon ratio
  (13px at `md`). A borderless variant (`primary`, `danger`) carries a
  transparent `1px` border, so its outer box matches a bordered variant and a
  text field instead of landing 2px shorter beside them.
- `Button`'s label carries a small optical nudge (`0.1×` the size) so text
  without descenders centers in the box instead of sitting high; the box height
  and padding are unchanged.
- An icon-only `Button` renders its glyph 15% larger while the button box and
  icon slot stay unchanged.

### Fixed

- `NumberInput` writes a value back with as many decimal places as the step or
  the entry it replaces, whichever is longer: a fractional step pads a coarse
  entry (`1` with `step={0.5}` renders `1.0`) and a finer entry keeps its digits
  (`1.25` stepped by `0.5` renders `1.75`) instead of rounding to the step.
- `DataGrid` cell text sits on the row's own box: the cell editor is a block
  element, so a cell no longer grows by the line box's descent below the text
  and the value centers in both the header and body rows.

## [0.4.0] - 2026-11-19

### Added

- `DataTable` managed mode: pass a `model` from `createTableModel`
  (`components/use-table-model.svelte`) and the controller owns the search
  filter, the sort order, the page slice, the selection set, and the footer,
  while the component only renders them. The pipeline is filter (searchable
  columns) -> sort (`sortValue`, or the row property; numeric-aware locale
  compare, missing values last in either direction) -> page, the search term
  resets the page, and the selection is pruned to the filtered rows. A managed
  table marks every data column sortable by default (`sortable: false` opts
  out), matching the list-table convention.
- `DataTable` batch toolbar: `toolbar`, `batchActions`, and `toolbarEnd`
  snippets over the selected rows plus a clear-selection callback, the
  `selectionCountPosition` summary, and the built-in Export/Clear pair
  (`selectionActions`, on by default in managed mode, with an optional
  `fileName` and export mapper).
- `DataTableColumn` takes `sortValue` and `searchValue` accessors, so a
  computed cell sorts and filters by its underlying value instead of its
  rendered markup.
- Shared `table.selected`, `table.export`, `table.exportSelected`, and
  `table.clearSelection` labels.
- `SelectDropdown` takes `leading` and `trailer` snippets: a leading block in
  the trigger's flex row and content outside the trigger. The trigger's
  `trailing` slot stays internal to the chevron, so no caller adornment
  competes with the marker.
- `TextArea` takes the shared `ClearableProps` (`clearable`, `clearLabel`,
  `clearPlacement`, `onClear`) plus `defaultValue`: the shared clear cross
  overlays the first line, reserves the same gutter and outside slot as
  `TextInput`, and resets to the baseline, with the same disabled/read-only
  behavior.
- `Tooltip` takes `size`: the hint box's font, line, padding, and radius follow
  the shared axis while `md` keeps the previous `text-xs` box, and the shipped
  `.st-tooltip` class reads the same custom properties with `md` fallbacks.
  `Button`, `Chip`, `BarChart`, `StructureNode`, and `DataTable` forward their
  own `size` to every hint they render.
- `CodeEditor` and `LazyCodeEditor` take `size`: the editor's font, content
  padding, playback-mark radius, and frame radius follow the axis, and a size
  change reconfigures the colour theme so the caret, scroll position, and
  selection survive. The lazy surface forwards it and scales its loading text.
- `DataTable` and `DataGrid` cells follow the size axis: text, line, padding,
  the selection column, the width-engine floor, the row handles, and the label
  row all read one metric set, and `md` keeps the previous cells plus the
  exported width constants.

### Changed

- `Tabs`'s default `variant` is `underline`; the segmented pill row is opt-in
  with `variant="segmented"`.
- `DataTable`'s `rows` and `rowId` are optional, because managed mode supplies
  both; a custom footer in managed mode follows the model's "another page
  exists" rule unless `showPagination` is set.
- `DataTable`'s managed controller defaults to 20 rows per page, and
  `Pagination` (so the table footer) offers `100` as its last default page-size
  choice: `[10, 20, 50, 100]`.
- `Pagination`'s footer gaps scale with `size`: the row gap and the extra
  section gap before the page-size group replace fixed utilities, and the
  section gap takes a 20% trim.
- `SelectDropdown`'s trigger and option rows now consume the input chrome's own
  `--input-*` text metrics instead of a parallel `--sel-*` set, and the
  filterable trigger renders its chevron as the field's `trailing` adornment.
  `SELECT_RATIOS` gains `chevronTextGap` for the label→chevron gap.
- `AutoComplete` and `TagInput` now share one entry and navigation policy: focus,
  a click, or typing reopens a dismissed suggestion list, and an unmodified arrow
  drives it on the dropdown and text-entry combobox surfaces (an `ArrowUp` on a
  closed list opens it onto the last row). `TagInput` now leaves a modified arrow
  (Shift/Ctrl/Alt, Home/End) to the text field, like the other surfaces.
- `TagInput`'s `Escape` dismisses the suggestion panel while keeping focus and the
  typed draft (it used to clear the draft first); typing, clicking the field, and
  either arrow reopen the panel, and `Enter` with it dismissed commits the draft as
  tag(s) instead of taking a list row.
- Every sized control's own chrome now follows its axis instead of staying at
  `md`: corner radii, internal gaps, container padding, and the grid/table shell
  geometry. `DataTable`'s `dense` step is its own ratio set rather than a
  multiplier of the normal cell.

### Fixed

- `ArrowUp` on a closed listbox opens it onto the last row and reveals it, so
  `TagInput`'s `Enter` accepts that row after the explicit navigation instead of
  committing the draft. `SelectDropdown`, `ChipDropdown`, and `AutoComplete`
  share the same behavior.
- `TagInput` keeps its entry beside the last chip while the row has room: the
  input's minimum width is now a size ratio (`inputMinW`, `0.75`) instead of a
  fixed `6rem`, so a row with space no longer wraps the caret onto an empty line
  and a partially filled row no longer doubles the box's height. The hint renders
  only while no tag occupies the row, so a narrow remainder never clips it.
- `TagInput` renders at the same height as a same-size `TextInput` or
  `SelectDropdown` trigger: the container's vertical padding now carries the
  remainder of the shared field padding instead of adding the inner input's
  share on top of it, so an empty tag row no longer sits taller than the fields
  beside it, and the empty and filled boxes keep one height.
- `TagInput`'s clear cross rides the shared `TextInput` clear affordance: the
  same trimmed button inside its reserved slot and gutter, anchored to the first
  tag row so wrapping tags never move or enlarge it.

## [0.3.1] - 2026-11-14

### Added

- `Tabs` takes `variant` (`segmented` default, `underline`), replacing the
  second tab component.
- `Chip` takes named `variant` (`cyan` default, plus sky, violet, amber,
  fuchsia, emerald, rose, and neutral) and `appearance` (`soft` default,
  `solid`, `outline`) tokens; `chipClass` stays the full override.
- `Pagination` takes `variant` (`numbered` default, `compact` summary).
- `Toast` takes `variant` (`soft` default, `solid`, `outline`) beside its
  severity `type`.
- A showcase props coverage gate in `npm run check`: every prop a component
  declares has a props-table row, and every primitive-typed row has an editor.

### Changed

- `TextInput`, `NumberInput`, `SelectDropdown`, and `TextArea` share one
  `variant` axis (`bordered` default, `embedded`); `AutoComplete`, `DateInput`,
  and `DateField` forward it, so a field no longer re-declares another
  control's chrome.
- `TagInput`'s default palette cycles the shared chip tokens instead of keeping
  a second palette.
- Every primitive prop in the showcase props tables is editable, including the
  previously read-only Chip `active`, Copyable `copyText`, Button `form`,
  Resizable `pointerOnlyHandles`, DataTable `bordered`, and BaseDialog
  `ariaLabel` and `dismissDisabled`.

### Fixed

- `DataTable` and `DataGrid` sort arrows sit on a 4px gap.

## [0.3.0] - 2026-11-03

### Changed

- The CodeMirror packages used by the editor are optional peers, so a consumer
  that never renders the editor no longer installs them.
- The README leads with the package instead of the showcase app, and the package
  ships a changelog.
- Tailwind CSS v4 is a declared peer dependency, because the stylesheet imports
  Tailwind rather than shipping compiled CSS.

### Fixed

- The shared-parity gate resolves SvelteKit 3 subpath imports (`#lib/*`) from
  each app's manifest, so a migrated app's references no longer read as dead
  ports.
- The test-layout gate no longer requires the generated `.svelte-kit/tsconfig.json`
  that SvelteKit 3 stopped writing.

## [0.2.1] - 2026-11-03

### Added

- Partial `ratios` overrides on every sized input-family control, so a caller
  can retune one metric without replacing the whole set.
- A ratios row on every sized input showcase page.

### Fixed

- Ratio resolution is shared between the field controls instead of repeated
  per control, closing the gaps where an override reached only some metrics.
- The showcase rejects non-positive ratio overrides.

## [0.2.0] - 2026-11-01

### Changed

- The app-private root is split into `state/` (theme, web settings) and
  `showcase/` (shell, playground, index), and the shared i18n store and storage
  helpers live in their own `src/lib` folders.
- The shared-parity gate resolves a consumer's package imports back to canonical
  source and fails on a path the tarball no longer ships.

## [0.1.10] - 2026-11-01

### Added

- `DataGrid` accepts an app storage prefix for persisted column widths.
- The shared surface publishes in place: `svelte-package` compiles `src/lib`,
  the build prunes server-only source and tests, `publint` lints the result, and
  `publish:check` installs the packed tarball into a scratch consumer.
- A caret-at-end keyboard-focus action for fields that edit a label in place.

### Changed

- The showcase shell moved out of the package source into the app-private root.
- `SelectDropdown`'s trigger and option rows take the text field's box, so a
  select sits level with a `TextInput` in one row.

## [0.1.7] - 2026-10-25

### Added

- Initial public release: the shared Svelte 5 components (inputs, selects,
  dialogs, tables, grid, tree, charts, editor), the icon set, actions, the i18n
  store, and the size and persistence helpers, with the showcase app that
  catalogues them.
