// parity: app-owned — package build shim for SvelteKit's $app/env
//
// The package aliases the framework module onto this file, so the compiled
// output carries no `$app` import while the canonical shared source keeps the
// SvelteKit binding its app copy uses.
export { BROWSER as browser, DEV as dev } from 'esm-env'
