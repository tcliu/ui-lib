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
  { slug: 'form-field', name: 'FormField' },
  { slug: 'number-input', name: 'NumberInput' },
  { slug: 'pagination', name: 'Pagination' },
  { slug: 'search-input', name: 'SearchInput' },
  { slug: 'select-dropdown', name: 'SelectDropdown' },
  { slug: 'spinner', name: 'Spinner' },
  { slug: 'tabs', name: 'Tabs' },
  { slug: 'tooltip', name: 'Tooltip' },
]
