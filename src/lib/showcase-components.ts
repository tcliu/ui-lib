export interface ShowcaseComponent {
  slug: string
  name: string
}

// Single source of truth for the index list and the per-component routes.
export const SHOWCASE_COMPONENTS: ShowcaseComponent[] = [
  { slug: 'base-dialog', name: 'BaseDialog' },
  { slug: 'button', name: 'Button' },
  { slug: 'buttons', name: 'Buttons' },
  { slug: 'checkbox', name: 'Checkbox' },
  { slug: 'chip', name: 'Chip' },
  { slug: 'combobox', name: 'Combobox' },
  { slug: 'copyable', name: 'Copyable' },
  { slug: 'data-table', name: 'DataTable' },
  { slug: 'date-range-picker', name: 'DateRangePicker' },
  { slug: 'edit-dialog', name: 'EditDialog' },
  { slug: 'form-field', name: 'FormField' },
  { slug: 'icons', name: 'Icons' },
  { slug: 'menu', name: 'Menu' },
  { slug: 'number-input', name: 'NumberInput' },
  { slug: 'pagination', name: 'Pagination' },
  { slug: 'password-input', name: 'PasswordInput' },
  { slug: 'search-input', name: 'SearchInput' },
  { slug: 'select-dropdown', name: 'SelectDropdown' },
  { slug: 'spinner', name: 'Spinner' },
  { slug: 'tabs', name: 'Tabs' },
  { slug: 'tag-input', name: 'TagInput' },
  { slug: 'toast', name: 'Toast' },
  { slug: 'tooltip', name: 'Tooltip' },
]
