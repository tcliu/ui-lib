// Shared label overrides for the Pagination control. Every field is optional:
// an unset field falls back to the component's own i18n key, so a caller
// replaces only the labels it wants to change.
export interface PaginationLabels {
  previous?: string
  next?: string
  pageSize?: string
  current?: string
  nav?: string
  // Compact-variant summary; `{page}` and `{total}` are replaced with the
  // current page and the page count.
  pageOf?: string
}
