// Show-code source for the Tabs demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

export interface TabsSnippetState {
  routeMode: string
  headerClass: string
  tabClass: string
}

export const STYLED_HEADER = 'flex w-full items-center gap-2 rounded-lg border border-cyan-500/40 p-2'
export const STYLED_TAB = 'text-cyan-300'

export function buildTabsSnippet({ routeMode, headerClass, tabClass }: TabsSnippetState): string {
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
    ...(routeMode ? ['  pathname={routePath}'] : []),
    ...(headerClass ? [`  headerClass="${headerClass}"`] : []),
    ...(tabClass ? [`  class="${tabClass}"`] : []),
    '  ariaLabel={componentsLabel} />',
  ]
  return lines.join('\n')
}
