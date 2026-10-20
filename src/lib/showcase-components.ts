export interface ShowcaseComponent {
  slug: string
  name: string
}

// Single source of truth for the index list and the per-component routes.
export const SHOWCASE_COMPONENTS: ShowcaseComponent[] = [
  { slug: 'app-shell', name: 'AppShell' },
  { slug: 'autocomplete', name: 'AutoComplete' },
  { slug: 'bar-chart', name: 'BarChart' },
  { slug: 'base-dialog', name: 'BaseDialog' },
  { slug: 'button', name: 'Button' },
  { slug: 'buttons', name: 'Buttons' },
  { slug: 'checkbox', name: 'Checkbox' },
  { slug: 'chip', name: 'Chip' },
  { slug: 'chip-dropdown', name: 'ChipDropdown' },
  { slug: 'code-editor', name: 'CodeEditor' },
  { slug: 'column-chooser', name: 'ColumnChooser' },
  { slug: 'confirm-dialog', name: 'ConfirmDialog' },
  { slug: 'copyable', name: 'Copyable' },
  { slug: 'data-grid', name: 'DataGrid' },
  { slug: 'data-table', name: 'DataTable' },
  { slug: 'date-input', name: 'DateInput' },
  { slug: 'edit-dialog', name: 'EditDialog' },
  { slug: 'editable-text', name: 'EditableText' },
  { slug: 'field-table', name: 'FieldTable' },
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
  { slug: 'structure-tree', name: 'StructureTree' },
  { slug: 'tabs', name: 'Tabs' },
  { slug: 'tag-input', name: 'TagInput' },
  { slug: 'text-input', name: 'TextInput' },
  { slug: 'textarea', name: 'TextArea' },
  { slug: 'toast', name: 'Toast' },
  { slug: 'tooltip', name: 'Tooltip' },
]

// Virtual browsing groups. They are not rendered and carry no user-facing
// label — they exist so relatedness is declared once per group instead of once
// per pair. Two components are related when they appear in at least one group
// together, which makes the relation symmetric by construction.
export const SHOWCASE_COMPONENT_GROUPS: Record<string, readonly string[]> = {
  // Overlay selectors built on the shared dropdown engine.
  selectors: ['select-dropdown', 'autocomplete', 'chip-dropdown', 'menu', 'column-chooser', 'date-input'],
  // Surfaces where typing filters the option list.
  textFilter: ['select-dropdown', 'autocomplete', 'tag-input'],
  // Chip and tag editing surfaces.
  tags: ['chip', 'tag-input', 'chip-dropdown'],
  // Modal dialogs.
  dialogs: ['base-dialog', 'confirm-dialog', 'edit-dialog'],
  // Form inputs.
  inputs: ['number-input', 'search-input', 'text-input', 'autocomplete', 'textarea', 'password-input', 'editable-text', 'form-field', 'tag-input', 'checkbox'],
  // Click/action affordances.
  actions: ['button', 'buttons', 'copyable'],
  // Tabular and charted data display.
  tables: ['data-grid', 'data-table', 'field-table', 'pagination', 'column-chooser', 'structure-tree', 'bar-chart'],
  // Code editing.
  code: ['code-editor', 'lazy-code-editor'],
  // Shell and layout primitives.
  layout: ['app-shell', 'splitter', 'resizable'],
  // Navigation surfaces.
  navigation: ['tabs', 'menu'],
  // Status and feedback.
  feedback: ['spinner', 'toast', 'tooltip', 'icons'],
}

// slug -> the group ids it belongs to, built once from the group table.
const GROUPS_BY_SLUG = new Map<string, string[]>()
for (const [groupId, members] of Object.entries(SHOWCASE_COMPONENT_GROUPS)) {
  for (const member of members) {
    const groups = GROUPS_BY_SLUG.get(member)
    if (groups) groups.push(groupId)
    else GROUPS_BY_SLUG.set(member, [groupId])
  }
}

// Components related to `slug`: the union of every group it belongs to, minus
// the slug itself, deduped and ordered by the registry so the chip row is
// stable. Unknown or ungrouped slugs yield an empty list.
export function getRelatedComponents(slug: string): ShowcaseComponent[] {
  const groups = GROUPS_BY_SLUG.get(slug)
  if (!groups) return []
  const relatedSlugs = new Set<string>()
  for (const groupId of groups) {
    for (const member of SHOWCASE_COMPONENT_GROUPS[groupId]) {
      if (member !== slug) relatedSlugs.add(member)
    }
  }
  return SHOWCASE_COMPONENTS.filter(component => relatedSlugs.has(component.slug))
}
