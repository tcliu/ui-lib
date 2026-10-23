// Show-code source for the TagInput demo section. Pure string building over the
// playground form state: the section regenerates the editor text from this, so
// the editor always shows the markup behind the demo above. The tag lists are
// seeded as script-local state so the snippet is self-contained and its text
// tracks Value edits instead of hiding the lists in scope. The alternate palette
// stays a symbolic scope helper (`altPalette`).
//
// The resize harness is ShowcasePage-owned chrome (its `stage` prop), so the
// snippet carries only the demo content the page authors inside that frame.

import { escapeAttr, escapeText } from '$lib/showcase/snippet-build'
import { sizeAttributeLine } from '$lib/showcase/size-input'

export type TriState = '' | 'yes' | 'no'

export const TAG_STAGE_DEFAULT_WIDTH = 560
export const TAG_STAGE_MIN_WIDTH = 240

export interface TagInputSnippetState {
  value: string[]
  // The tag lists apply only while their eye toggle is on, mirroring the
  // page (off omits the prop; the committed lists stay in the dialog).
  valueEnabled: boolean
  options: string[]
  optionsEnabled: boolean
  defaultValue: string[]
  defaultValueOn: boolean
  placeholder: string
  placeholderOn: boolean
  size: string
  sizeOn: boolean
  palette: string
  paletteOn: boolean
  disabled: TriState
  disabledOn: boolean
  clearable: TriState
  clearableOn: boolean
  clearLabel: string
  clearLabelOn: boolean
  clearPlacement: string
  clearPlacementOn: boolean
  id: string
  idOn: boolean
  chipClass: string
  chipClassOn: boolean
  chip: string
  option: string
}

// Element text for the chip/option prefix spans below.

// A tri-state line: omitted while unset or at the component default, bare
// while Yes, ={false} while No.
function flagLine(name: string, value: TriState, indent: string, def: TriState = ''): string[] {
  if (value === '' || value === def) {
    return []
  }
  return [`${indent}${name}${value === 'yes' ? '' : '={false}'}`]
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

export function buildTagInputSnippet({
  value,
  valueEnabled,
  options,
  optionsEnabled,
  defaultValue,
  defaultValueOn,
  placeholder,
  placeholderOn,
  size,
  sizeOn,
  palette,
  paletteOn,
  disabled,
  disabledOn,
  clearable,
  clearableOn,
  clearLabel,
  clearLabelOn,
  clearPlacement,
  clearPlacementOn,
  id,
  idOn,
  chipClass,
  chipClassOn,
  chip,
  option,
}: TagInputSnippetState): string {
  // The frame is shell chrome, so the component sits at the snippet root with
  // its attributes one step in; the tag lists are script-local state.
  // JSON.stringify keeps the seeded lists valid no matter what the tags hold.
  const indent = '  '
  const seedList = (name: string, list: string[], mutable: boolean): string =>
    `${indent}${mutable ? 'let' : 'const'} ${name} = ${mutable ? '$state(' : ''}${JSON.stringify(list)}${mutable ? ')' : ''};`
  const hasRenderers = chip !== '' || option !== ''
  return [
    '<script>',
    ...(valueEnabled ? [seedList('value', value, true)] : []),
    ...(optionsEnabled ? [seedList('options', options, false)] : []),
    // The default list is a read-only baseline: seeded like the other lists
    // (so snippet edits round-trip through the same parse-back) but never
    // reassigned in the demo.
    ...(defaultValueOn ? [seedList('defaultValue', defaultValue, true)] : []),
    '</script>',
    '<TagInput',
    ...(valueEnabled ? [`${indent}value={value}`] : []),
    ...(optionsEnabled ? [`${indent}options={options}`] : []),
    ...(defaultValueOn ? [`${indent}defaultValue={defaultValue}`] : []),
    ...(placeholderOn && placeholder ? [`${indent}placeholder="${escapeAttr(placeholder)}"`] : []),
    // The size row prefills its component default in the Value column; the
    // builder omits the default so Show-code stays minimal.
    ...(sizeOn && size !== '' && size !== 'md' ? sizeAttributeLine(size, indent) : []),
    ...(paletteOn && palette ? [`${indent}palette={altPalette}`] : []),
    ...(disabledOn ? flagLine('disabled', disabled, indent, 'no') : []),
    ...(clearableOn ? flagLine('clearable', clearable, indent, 'no') : []),
    ...(clearLabelOn && clearLabel ? [`${indent}clearLabel="${escapeAttr(clearLabel)}"`] : []),
    ...(clearPlacementOn && clearPlacement !== '' && clearPlacement !== 'auto' ? [`${indent}clearPlacement="${escapeAttr(clearPlacement)}"`] : []),
    ...(idOn && id ? [`${indent}id="${escapeAttr(id)}"`] : []),
    ...(chipClassOn && chipClass ? [`${indent}chipClass="${escapeAttr(chipClass)}"`] : []),
    ...(chip ? [`${indent}chip={chip}`] : []),
    ...(option ? [`${indent}option={option}`] : []),
    ...(hasRenderers
      ? [
          ...(valueEnabled ? [`${indent}onChange={next => (value = next)}>`] : [`${indent}>`]),
          ...(chip
            ? [
                `${indent}{#snippet chip(tag, remove)}`,
                `${indent}  <span>${escapeText(chip)}{tag} <button type="button" onclick={remove} aria-label="Remove {tag}">×</button></span>`,
                `${indent}{/snippet}`,
              ]
            : []),
          ...(option
            ? [
                `${indent}{#snippet option(tag)}`,
                `${indent}  <span>${escapeText(option)}{tag}</span>`,
                `${indent}{/snippet}`,
              ]
            : []),
          `</TagInput>`,
        ]
      : [...(valueEnabled ? [`${indent}onChange={next => (value = next)} />`] : [`${indent}/>`])]),
    ...(valueEnabled ? [`<span class="text-sm text-slate-400">tags: {value.join(', ')}</span>`] : []),
  ].join('\n')
}
