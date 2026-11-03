// Show-code source for the Tabs demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above.

import { sizeAttrLine, textAttrLine } from '#showcase/playground/snippet-build.js'
import type { Staged } from '#showcase/playground/staged.js'

export interface TabsSnippetState {
  routeMode: string
  className: Staged<string>
  ariaLabel: Staged<string>
  pathname: Staged<string>
  size: Staged<string>
}

export const STYLED_HEADER = 'flex w-full items-center gap-2 rounded-lg border border-cyan-500/40 p-2'

export function buildTabsSnippet({ routeMode, className, ariaLabel, pathname, size }: TabsSnippetState): string {
  const overviewPath = routeMode ? '#overview' : 'overview'
  const detailsPath = routeMode ? '#details' : 'details'
  const pathnameAttr = textAttrLine('pathname', pathname)
  const ariaLabelAttr = textAttrLine('ariaLabel', ariaLabel)
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
    ...(pathnameAttr.length ? pathnameAttr : routeMode ? ['  pathname={routePath}'] : []),
    ...textAttrLine('className', className),
    // The size row prefills its `md` default; the builder omits it.
    ...sizeAttrLine(size),
    // A custom label renders as a literal; unset, the nav reads the scope label.
    ...(ariaLabelAttr.length ? ariaLabelAttr : ['  ariaLabel={componentsLabel}']),
    '/>',
  ]
  return lines.join('\n')
}
