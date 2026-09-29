export interface ShowcaseComponent {
  slug: string
  name: string
}

// Single source of truth for the index list and the per-component routes.
export const SHOWCASE_COMPONENTS: ShowcaseComponent[] = [
  { slug: 'app-shell', name: 'AppShell' },
  { slug: 'base-dialog', name: 'BaseDialog' },
  { slug: 'button', name: 'Button' },
  { slug: 'buttons', name: 'Buttons' },
  { slug: 'checkbox', name: 'Checkbox' },
  { slug: 'chip', name: 'Chip' },
  { slug: 'chip-dropdown', name: 'ChipDropdown' },
  { slug: 'code-editor', name: 'CodeEditor' },
  { slug: 'column-chooser', name: 'ColumnChooser' },
  { slug: 'combobox', name: 'Combobox' },
  { slug: 'confirm-dialog', name: 'ConfirmDialog' },
  { slug: 'copy-button', name: 'CopyButton' },
  { slug: 'copyable', name: 'Copyable' },
  { slug: 'data-grid', name: 'DataGrid' },
  { slug: 'data-table', name: 'DataTable' },
  { slug: 'date-range-picker', name: 'DateRangePicker' },
  { slug: 'edit-dialog', name: 'EditDialog' },
  { slug: 'editable-text', name: 'EditableText' },
  { slug: 'form-field', name: 'FormField' },
  { slug: 'icons', name: 'Icons' },
  { slug: 'lazy-code-editor', name: 'LazyCodeEditor' },
  { slug: 'menu', name: 'Menu' },
  { slug: 'number-input', name: 'NumberInput' },
  { slug: 'pagination', name: 'Pagination' },
  { slug: 'password-input', name: 'PasswordInput' },
  { slug: 'resizable', name: 'Resizable' },
  { slug: 'search-input', name: 'SearchInput' },
  { slug: 'select-dropdown', name: 'SelectDropdown' },
  { slug: 'spinner', name: 'Spinner' },
  { slug: 'splitter', name: 'Splitter' },
  { slug: 'tabs', name: 'Tabs' },
  { slug: 'tag-input', name: 'TagInput' },
  { slug: 'toast', name: 'Toast' },
  { slug: 'tooltip', name: 'Tooltip' },
]
