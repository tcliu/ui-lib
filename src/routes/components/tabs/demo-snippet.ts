// Show-code source for the Tabs demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

export interface TabsSnippetState {
  routeMode: string
  className: string
  classNameOn: boolean
  ariaLabel: string
  ariaLabelOn: boolean
  pathname: string
  pathnameOn: boolean
}

export const STYLED_HEADER = 'flex w-full items-center gap-2 rounded-lg border border-cyan-500/40 p-2'

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function buildTabsSnippet({ routeMode, className, classNameOn, ariaLabel, ariaLabelOn, pathname, pathnameOn }: TabsSnippetState): string {
  const overviewPath = routeMode ? '#overview' : 'overview'
  const detailsPath = routeMode ? '#details' : 'details'
  const lines = [
    ...(routeMode
      ? [
          '<Button onClick={() => (routePath = routePath === `#overview` ? `#details` : `#overview`)}>',
          '  pathname: {routePath}',
          '</Button>',
        ]
      : []),
    '<Tabs',
    '  tabs={[',
    `    { label: defaultLabel, path: '${overviewPath}', content: overviewContent, toolbar: overviewToolbar },`,
    `    { label: customizedLabel, path: '${detailsPath}', content: detailsContent },`,
    '  ]}',
    '  state={demoState}',
    // A literal pathname wins; unset, route mode reads the path from scope.
    ...(pathnameOn && pathname ? [`  pathname="${escapeAttr(pathname)}"`] : routeMode ? ['  pathname={routePath}'] : []),
    ...(classNameOn && className ? [`  className="${className}"`] : []),
    // A custom label renders as a literal; unset, the nav reads the scope label.
    ...(ariaLabelOn && ariaLabel ? [`  ariaLabel="${escapeAttr(ariaLabel)}"`] : ['  ariaLabel={componentsLabel}']),
    '/>',
  ]
  return lines.join('\n')
}
