// The Svelte compiler's client output imports `svelte/internal/client`, a
// runtime-only subpath that ships no type declarations. The showcase playground
// only forwards the namespace opaquely into the compiled factory, so a loose
// shape is sufficient.
declare module 'svelte/internal/client' {
  const client: Record<string, unknown>
  export = client
}
