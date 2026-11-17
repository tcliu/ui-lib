# Changelog

All notable changes to this package are documented here. Each published
version has one section, newest first; the format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2026-11-16

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

### Changed

- `Tabs`'s default `variant` is `underline`; the segmented pill row is opt-in
  with `variant="segmented"`.
- `DataTable`'s `rows` and `rowId` are optional, because managed mode supplies
  both; a custom footer in managed mode follows the model's "another page
  exists" rule unless `showPagination` is set.
- `SelectDropdown`'s trigger and option rows now consume the input chrome's own
  `--input-*` text metrics instead of a parallel `--sel-*` set, and the
  filterable trigger renders its chevron as the field's `trailing` adornment.
  `SELECT_RATIOS` gains `chevronTextGap` for the label→chevron gap.

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
