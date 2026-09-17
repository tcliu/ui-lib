// English messages. This file defines the key set (`MessageKey`); every other
// locale must implement exactly these keys.
//
// The `common.*`, `number.*`, `dropdown.*`, `pagination.*`, `tabs.*`,
// `search.*`, `splitter.*`, `password.*`, `combobox.*`, and `tagInput.*` blocks
// are the shared label contract the ported UI primitives
// fall back to when a caller passes no label prop. A host app that vendors a
// primitive provides the same keys in its own locale dictionaries.
export const en = {
  'common.close': 'Close',
  'common.closeDialog': 'Close dialog',
  'common.ok': 'OK',
  'common.cancel': 'Cancel',
  'common.apply': 'Apply',
  'common.reload': 'Reload',
  'common.reset': 'Reset',

  'number.increment': 'Increment',
  'number.decrement': 'Decrement',
  'dropdown.noOptions': 'No options',

  'pagination.pageSize': 'Page size',
  'pagination.previous': 'Previous page',
  'pagination.next': 'Next page',
  'pagination.label': 'Pagination',
  'pagination.current': 'Current page',

  'tabs.label': 'Tabs',
  'search.placeholder': 'Search...',
  'splitter.resize': 'Resize',
  'password.show': 'Show password',
  'password.hide': 'Hide password',
  'combobox.remove': 'Remove {name}',
  'tagInput.suggestions': 'Tag suggestions',
  'tagInput.remove': 'Remove {name}',

  'showcase.title': 'UI Library',
  'showcase.intro':
    'Canonical shared UI primitives for the sibling apps. Each page demonstrates one component, its props, and its customization surface.',
  'showcase.components': 'Components',
  'showcase.theme': 'Theme',
  'showcase.language': 'Language',
  'showcase.searchComponents': 'Search components',
  'showcase.props': 'Props',
  'showcase.default': 'Default',
  'showcase.customized': 'Customized',
  'showcase.iconsBadgeTooltip': 'Icons, badge, tooltip',
  'showcase.interactive': 'Interactive',
  'showcase.state': 'State',
  'showcase.events': 'Events',
  'showcase.routeMode': 'Route mode',
  'showcase.backToIndex': 'All components',
  'showcase.prop': 'Prop',
  'showcase.type': 'Type',
  'showcase.note': 'Notes',
  'showcase.openDialog': 'Open dialog',
  'showcase.dialogTitle': 'Dialog title',
  'showcase.dialogBody': 'Dialog body content.',
  'showcase.pendingOption': 'Pending',
  'showcase.allowPendingCancel': 'Allow cancel while pending',
  'showcase.fullscreenDialog': 'Fullscreen dialog',
}

export type MessageKey = keyof typeof en
