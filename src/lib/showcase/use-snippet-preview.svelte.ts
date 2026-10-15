import { mount, onDestroy, tick, unmount } from 'svelte'
import { createSnippetComponent } from './snippet-playground'
import { snippetErrorMessage } from './snippet-source'
import { syncSnippetToState, type SyncField } from './snippet-sync'

interface SnippetPreviewOptions {
  // Current seed source for the panel; read synchronously so seed edits
  // re-seed the draft while the panel is open.
  getSeed: () => string
  // Values the snippet references besides the shared primitives. Read only
  // inside the debounced callback so scope changes never retrigger a compile.
  getScope: () => Record<string, unknown>
  // Runs after a source compiles and swaps in. A page whose snippet reads
  // scope keys the seed does not cover uses it to write parsed values back
  // into page state (then calls `syncSeed`), so the panel stays coherent with
  // snippet edits. Never runs on failure.
  onCompiled?: (source: string) => void
  // Writes a compiled excerpt's recognized attributes back into page state and
  // reseeds, so the editor keeps the user's text. A converted page passes its
  // sync table here instead of hand-rolling an `onCompiled`. `getFields` is
  // read per compile so later field edits are honored.
  sync?: { tag: string | null; getFields: () => SyncField[] }
}

// Live-playground state for one showcase section. The section renders its
// static demo until the first successful compile, then swaps the demo row
// with the live instance in place. Instantiate once per section at component
// init; it registers its own effects and teardown.
export class SnippetPreview {
  open = $state(false)
  draft = $state('')
  error = $state('')
  // True once a live instance has mounted: the section renders the live
  // container instead of the static demo.
  live = $state(false)
  // Bound to the live container; the compiled instance mounts only here.
  liveEl = $state<HTMLDivElement | null>(null)

  private timer: ReturnType<typeof setTimeout> | null = null
  private generation = 0
  private instance: ReturnType<typeof mount> | null = null
  private lastSeed: string | undefined = undefined
  private disposed = false

  constructor(private options: SnippetPreviewOptions) {
    // Seed the editable text when the panel opens, and re-seed only when the
    // seed actually changes so local edits survive unrelated re-renders.
    $effect(() => {
      if (!this.open) return
      const seed = this.options.getSeed()
      if (seed === this.lastSeed) return
      this.lastSeed = seed
      this.draft = seed
    })

    // Debounce recompiles: an edit restarts the timer, so the compiler only
    // runs once the typing pauses. The cleanup clears the pending timer on
    // the next edit and on teardown.
    $effect(() => {
      if (!this.open) return
      const next = this.draft
      if (this.timer) clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.timer = null
        void this.compileAndRender(next, this.options.getScope())
      }, 300)
      return () => {
        if (this.timer) {
          clearTimeout(this.timer)
          this.timer = null
        }
      }
    })

    onDestroy(() => this.dispose())
  }

  toggle() {
    if (this.open) this.close()
    else this.open = true
  }

  // Recompile the current draft against fresh scope: page state backing scope
  // keys can change without altering the seed (e.g. a value the snippet reads
  // from scope), which otherwise leaves the live instance stale behind the
  // open editor. Debounced like edits, and a no-op while closed.
  refresh() {
    if (!this.open) return
    if (this.timer) clearTimeout(this.timer)
    const next = this.draft
    this.timer = setTimeout(() => {
      this.timer = null
      void this.compileAndRender(next, this.options.getScope())
    }, 300)
  }

  // Mark the current seed as consumed without touching the draft: use after
  // writing page state back from a compiled source, so the reseed effect does
  // not overwrite the editor with the regenerated text.
  syncSeed() {
    this.lastSeed = this.options.getSeed()
  }

  close() {
    this.open = false
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    // Invalidate any in-flight compile so it cannot swap after the close.
    this.generation += 1
    this.teardownInstance()
    this.live = false
    this.error = ''
    // Force a reseed on the next open so each open compiles the seed.
    this.lastSeed = undefined
  }

  private teardownInstance() {
    if (this.instance) {
      void unmount(this.instance)
      this.instance = null
    }
  }

  private dispose() {
    this.disposed = true
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.generation += 1
    this.teardownInstance()
  }

  private async compileAndRender(source: string, scope: Record<string, unknown>) {
    const generation = ++this.generation
    try {
      const Component = await createSnippetComponent(source, scope)
      if (generation !== this.generation || this.disposed) return
      // Render into a detached staging node first: a render-time throw must
      // leave the previous demo in place, not blank it.
      const staging = document.createElement('div')
      const instance = mount(Component, { target: staging })
      if (generation !== this.generation || this.disposed) {
        void unmount(instance)
        return
      }
      const nodes = Array.from(staging.childNodes)
      if (!this.live) {
        // A compile that went stale (or outlived the open panel) must never
        // claim the live slot: setting live while closed strands the demo on
        // an empty live container after Hide code.
        if (generation !== this.generation || this.disposed || !this.open) {
          void unmount(instance)
          return
        }
        this.live = true
        await tick()
      }
      if (generation !== this.generation || this.disposed || !this.open) {
        void unmount(instance)
        if (!this.open) this.live = false
        return
      }
      this.teardownInstance()
      this.instance = instance
      this.liveEl?.replaceChildren(...nodes)
      this.error = ''
      const sync = this.options.sync
      if (sync) {
        syncSnippetToState(source, { tag: sync.tag, fields: sync.getFields(), onDone: () => this.syncSeed() })
      }
      this.options.onCompiled?.(source)
    } catch (failure) {
      if (generation !== this.generation || this.disposed) return
      this.error = snippetErrorMessage(failure)
    }
  }
}
