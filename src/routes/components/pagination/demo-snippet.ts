// Show-code source for the Pagination demo section. Pure string building over
// the playground form state: the section regenerates the editor text from
// this, so the editor always shows the markup behind the demo above.

export interface PaginationSnippetState {
  size: string
  customOptions: string
  customLabels: string
  className: string
}

export const STYLED_CLASS = 'rounded-lg border border-cyan-500/40 p-2'

export function buildPaginationSnippet({
  size,
  customOptions,
  customLabels,
  className,
}: PaginationSnippetState): string {
  const lines = [
    '<Pagination',
    '  total={200}',
    '  pageSize={pageSize}',
    '  currentPage={currentPage}',
    ...(size ? [`  size="${size}"`] : []),
    ...(customOptions ? ['  pageSizeOptions={[5, 10, 25, 100]}'] : []),
    ...(customLabels
      ? [
          '  previousLabel="Go back"',
          '  nextLabel="Go forward"',
          '  pageSizeLabel="Rows"',
          '  currentPageLabel="Page number"',
          '  paginationLabel="Results"',
        ]
      : []),
    ...(className ? [`  className="${className}"`] : []),
    '  onPageChange={page => (currentPage = page)}',
    '  onPageSizeChange={handlePageSizeChange} />',
  ]
  return lines.join('\n')
}
