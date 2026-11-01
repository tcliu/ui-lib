// Show-code source for the TagInput demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The tag lists are
// seeded as script-local state so the snippet is self-contained and its text
// tracks Value edits instead of hiding the lists in scope. The alternate palette
// stays a symbolic scope helper (`altPalette`).
//
// The resize harness is ShowcasePage-owned chrome (its `stage` prop), so the
// snippet carries only the demo content the page authors inside that frame.

import { boolAttrLine, enumAttrLine, escapeText, sizeAttrLine, textAttrLine, type TriState } from '$showcase/playground/snippet-build'
import type { Staged } from '$showcase/playground/staged'

export const TAG_STAGE_DEFAULT_WIDTH = 560
export const TAG_STAGE_MIN_WIDTH = 240

export interface TagInputSnippetState {
  // The tag lists apply only while their eye toggle is on, mirroring the
  // page (off omits the prop; the committed lists stay in the dialog).
  value: Staged<string[]>
  options: Staged<string[]>
  defaultValue: Staged<string[]>
  placeholder: Staged<string>
  size: Staged<string>
  palette: Staged<string>
  disabled: Staged<TriState>
  clearable: Staged<TriState>
  clearLabel: Staged<string>
  clearPlacement: Staged<string>
  id: Staged<string>
  chipClass: Staged<string>
  chip: Staged<string>
  option: Staged<string>
}

// Validate unknown data into a tag list (every entry a string). Returns null
// for anything else, so the dialogs and parse-back apply only well-shaped
// lists.
export function parseTagListValue(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every(entry => typeof entry === 'string')) {
    return null
  }
  return [...value]
}

// Parse a tag-list editor draft (a JSON array of strings). Returns null for
// anything else, so the dialog can block OK and explain instead of applying
// half-shaped data.
export function parseTagListJson(text: string): string[] | null {
  try {
    return parseTagListValue(JSON.parse(text))
  } catch {
    return null
  }
}

export function buildTagInputSnippet(state: TagInputSnippetState): string {
  const { value, options, defaultValue, placeholder, size, palette, disabled, clearable, clearLabel, clearPlacement, id, chipClass, chip, option } = state
  // The frame is shell chrome, so the component sits at the snippet root with
  // its attributes one step in; the tag lists are script-local state.
  // JSON.stringify keeps the seeded lists valid no matter what the tags hold.
  const indent = '  '
  const seedList = (name: string, list: string[], mutable: boolean): string =>
    `${indent}${mutable ? 'let' : 'const'} ${name} = ${mutable ? '$state(' : ''}${JSON.stringify(list)}${mutable ? ')' : ''};`
  // A renderer's prefix applies only while its eye is on.
  const chipText = chip.on ? chip.value : ''
  const optionText = option.on ? option.value : ''
  const hasRenderers = chipText !== '' || optionText !== ''
  return [
    '<script>',
    ...(value.on ? [seedList('value', value.value, true)] : []),
    ...(options.on ? [seedList('options', options.value, false)] : []),
    // The default list is a read-only baseline: seeded like the other lists
    // (so snippet edits round-trip through the same parse-back) but never
    // reassigned in the demo.
    ...(defaultValue.on ? [seedList('defaultValue', defaultValue.value, true)] : []),
    '</script>',
    '<TagInput',
    ...(value.on ? [`${indent}value={value}`] : []),
    ...(options.on ? [`${indent}options={options}`] : []),
    ...(defaultValue.on ? [`${indent}defaultValue={defaultValue}`] : []),
    ...textAttrLine('placeholder', placeholder, indent),
    // The size row prefills its component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...sizeAttrLine(size, indent),
    ...(palette.on && palette.value ? [`${indent}palette={altPalette}`] : []),
    ...boolAttrLine('disabled', disabled, 'no', indent),
    ...boolAttrLine('clearable', clearable, 'no', indent),
    ...textAttrLine('clearLabel', clearLabel, indent),
    ...enumAttrLine('clearPlacement', clearPlacement, 'auto', indent),
    ...textAttrLine('id', id, indent),
    ...textAttrLine('chipClass', chipClass, indent),
    ...(chipText ? [`${indent}chip={chip}`] : []),
    ...(optionText ? [`${indent}option={option}`] : []),
    ...(hasRenderers
      ? [
          ...(value.on ? [`${indent}onChange={next => (value = next)}>`] : [`${indent}>`]),
          ...(chipText
            ? [
                `${indent}{#snippet chip(tag, remove)}`,
                `${indent}  <span>${escapeText(chipText)}{tag} <button type="button" onclick={remove} aria-label="Remove {tag}">×</button></span>`,
                `${indent}{/snippet}`,
              ]
            : []),
          ...(optionText
            ? [
                `${indent}{#snippet option(tag)}`,
                `${indent}  <span>${escapeText(optionText)}{tag}</span>`,
                `${indent}{/snippet}`,
              ]
            : []),
          `</TagInput>`,
        ]
      : [...(value.on ? [`${indent}onChange={next => (value = next)} />`] : [`${indent}/>`])]),
    ...(value.on ? [`<span class="text-sm text-slate-400">tags: {value.join(', ')}</span>`] : []),
  ].join('\n')
}
