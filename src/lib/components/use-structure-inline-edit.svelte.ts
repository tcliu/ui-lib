// A measured inline text field: the edit key/text/min-width/input ref, the
// focus-on-begin and auto-width effects, and the begin/cancel transitions. The
// three StructureTree rename/edit flows share this machinery; the surrounding
// component owns the commit and keydown logic that interprets the text.
export function createInlineEdit<K>() {
  let key = $state<K | null>(null)
  let text = $state('')
  let minWidth = $state(0)
  let input = $state<HTMLInputElement | null>(null)

  $effect(() => {
    if (key !== null) {
      input?.focus()
    }
  })

  $effect(() => {
    if (key === null || !input) return
    void text
    input.style.width = '0px'
    const contentW = input.scrollWidth
    input.style.width = `${Math.max(minWidth, contentW + 8)}px`
  })

  function begin(nextKey: K, initial: string, nextMinWidth: number) {
    minWidth = nextMinWidth
    key = nextKey
    text = initial
  }

  function cancel() {
    key = null
  }

  return {
    get key() {
      return key
    },
    get text() {
      return text
    },
    set text(value: string) {
      text = value
    },
    get input() {
      return input
    },
    set input(value: HTMLInputElement | null) {
      input = value
    },
    get minWidth() {
      return minWidth
    },
    begin,
    cancel,
  }
}
