# Changelog

All notable changes to this package are documented here. Each published
version has one section, newest first; the format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The CodeMirror packages used by the editor are optional peers, so a consumer
  that never renders the editor no longer installs them.
- The README leads with the package instead of the showcase app, and the package
  ships a changelog.

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
