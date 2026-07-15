import {
  defineKeymap,
  definePlugin,
  union,
  wrap,
  type PlainExtension,
} from '@prosekit/core'
import { lift } from '@prosekit/pm/commands'
import type { Attrs, Mark, Node as ProseMirrorNode } from '@prosekit/pm/model'
import {
  EditorState,
  PluginKey,
  ProseMirrorPlugin,
  TextSelection,
  type Command,
  type Transaction,
} from '@prosekit/pm/state'
import type { EditorView } from '@prosekit/pm/view'

export type MarkApplyMode = 'replace' | 'merge'

export interface FormatPainterMarkOptions {
  exclude?: string[]
  preserve?: string[]
  apply?: MarkApplyMode
  filter?: (markName: string, context: { state: EditorState }) => boolean
}

export interface FormatPainterTextblockOptions {
  include?: Array<'blockType' | 'attrs'>
  blockTypes?: {
    include?: string[]
  }
  attrs?: {
    include?: string[]
    byType?: Record<string, string[]>
  }
}

export interface FormatPainterWrapperOptions {
  include?: string[]
  attrs?: Record<string, string[]>
}

export interface UnsupportedStyleContext {
  reason: FormatPainterUnsupportedReason
  state: EditorState
  target: FormatPainterTarget
}

export type FormatPainterUnsupportedReason =
  | 'missing-mark-type'
  | 'invalid-mark-attrs'
  | 'missing-textblock-type'
  | 'incompatible-textblock'
  | 'incompatible-wrapper'

export interface FormatPainterTarget {
  from: number
  to: number
}

export interface FormatPainterOptions {
  marks?: FormatPainterMarkOptions
  textblock?: FormatPainterTextblockOptions
  wrappers?: FormatPainterWrapperOptions
  interaction?: {
    applyOnMouseUp?: boolean
  }
  onUnsupportedStyle?: (
    style: FormatPainterUnsupportedStyle,
    context: UnsupportedStyleContext,
  ) => void
}

export const defaultFormatPainterOptions = {
  marks: {
    exclude: ['link'],
    apply: 'replace',
  },
  textblock: {
    include: [],
  },
  wrappers: {
    include: [],
  },
  interaction: {
    applyOnMouseUp: true,
  },
} satisfies FormatPainterOptions

export const blockFormatPainterOptions = {
  ...defaultFormatPainterOptions,
  textblock: {
    include: ['blockType', 'attrs'],
    blockTypes: { include: ['paragraph', 'heading'] },
    attrs: {
      include: ['textAlign'],
      byType: {
        heading: ['level', 'textAlign'],
      },
    },
  },
  wrappers: {
    include: ['blockquote', 'list'],
    attrs: {
      list: ['kind', 'order'],
    },
  },
} satisfies FormatPainterOptions

export type FormatPainterUnsupportedStyle =
  | { kind: 'mark'; type: string; attrs?: Attrs }
  | { kind: 'textblock'; type: string; attrs?: Attrs }
  | { kind: 'wrapper'; type: string; attrs?: Attrs }

export interface MarkSample {
  type: string
  attrs: Attrs
}

export interface TextblockSample {
  type?: string
  attrs?: Attrs
}

export interface WrapperSample {
  type: string
  attrs?: Attrs
}

export interface FormatSample {
  marks: MarkSample[]
  textblock?: TextblockSample
  wrappers?: WrapperSample[]
}

export interface FormatPainterState {
  active: boolean
  sticky: boolean
  sample: FormatSample | null
}

export interface ToggleFormatPainterOptions {
  sticky?: boolean
}

export interface FormatPainterController {
  extension: PlainExtension
  commands: {
    copyFormat: Command
    applyFormat: Command
    toggleFormatPainter: (options?: ToggleFormatPainterOptions) => Command
    clearFormatPainter: Command
  }
  copyFormatForView: (view: EditorView) => boolean
  applyFormatForView: (view: EditorView) => boolean
  toggleFormatPainterForView: (
    view: EditorView,
    options?: ToggleFormatPainterOptions,
  ) => boolean
  clearFormatPainterForView: (view: EditorView) => boolean
  getState: (state: EditorState) => FormatPainterState
  isActive: (state: EditorState) => boolean
  getSample: (state: EditorState) => FormatSample | null
  setSample: (
    view: EditorView,
    sample: FormatSample | null,
    options?: { active?: boolean; sticky?: boolean },
  ) => boolean
}

interface FormatPainterMeta {
  active?: boolean
  sticky?: boolean
  sample?: FormatSample | null
}

interface ResolvedOptions {
  marks: Required<Omit<FormatPainterMarkOptions, 'filter'>> & {
    filter?: FormatPainterMarkOptions['filter']
  }
  textblock: {
    include: Array<'blockType' | 'attrs'>
    blockTypes: {
      include: string[]
    }
    attrs: {
      include: string[]
      byType: Record<string, string[]>
    }
  }
  wrappers: {
    include: string[]
    attrs: Record<string, string[]>
  }
  interaction: {
    applyOnMouseUp: boolean
  }
  onUnsupportedStyle?: FormatPainterOptions['onUnsupportedStyle']
}

const initialState: FormatPainterState = {
  active: false,
  sticky: false,
  sample: null,
}

export const formatPainterPluginKey =
  new PluginKey<FormatPainterState>('prosekit-format-painter')

export function defineFormatPainter(
  options: FormatPainterOptions = {},
): PlainExtension {
  const resolved = resolveOptions(options)

  return union(
    defineFormatPainterPlugin(resolved),
    defineKeymap({
      Escape: clearFormatPainter,
    }),
  )
}

export function createFormatPainter(
  options: FormatPainterOptions = {},
): FormatPainterController {
  return {
    extension: defineFormatPainter(options),
    commands: {
      copyFormat: copyFormat(options),
      applyFormat: applyFormat(options),
      toggleFormatPainter: (toggleOptions = {}) =>
        toggleFormatPainter({ ...options, ...toggleOptions }),
      clearFormatPainter,
    },
    copyFormatForView: (view) => copyFormatForView(view, options),
    applyFormatForView: (view) => applyFormatForView(view, options),
    toggleFormatPainterForView: (view, toggleOptions = {}) =>
      toggleFormatPainterForView(view, { ...options, ...toggleOptions }),
    clearFormatPainterForView,
    getState: getFormatPainterState,
    isActive: isFormatPainterActive,
    getSample: getFormatSample,
    setSample: setFormatSample,
  }
}

export function getFormatPainterState(
  state: EditorState,
): FormatPainterState {
  return formatPainterPluginKey.getState(state) || initialState
}

export function isFormatPainterActive(state: EditorState): boolean {
  return getFormatPainterState(state).active
}

export const formatPainterCommands = {
  copyFormat,
  applyFormat,
  toggleFormatPainter,
  clearFormatPainter,
}

export function clearFormatPainter(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  _view?: EditorView,
): boolean {
  if (!getFormatPainterState(state).active) return false

  dispatch?.(
    state.tr.setMeta(formatPainterPluginKey, {
      active: false,
      sticky: false,
    } satisfies FormatPainterMeta),
  )
  return true
}

export function copyFormat(options: FormatPainterOptions = {}): Command {
  const resolved = resolveOptions(options)
  return (state, dispatch) => {
    const sample = createFormatSample(state, resolved)
    if (!sample) return false

    dispatch?.(
      state.tr.setMeta(formatPainterPluginKey, {
        active: true,
        sticky: false,
        sample,
      } satisfies FormatPainterMeta),
    )
    return true
  }
}

export function applyFormat(options: FormatPainterOptions = {}): Command {
  const resolved = resolveOptions(options)
  return (state, dispatch) => {
    const pluginState = getFormatPainterState(state)
    const sample = pluginState.sample
    if (!sample) return false

    const tr = state.tr
    let changed = applySampleToTransaction(tr, state, sample, resolved)

    if (changed && pluginState.active && !pluginState.sticky) {
      tr.setMeta(formatPainterPluginKey, {
        active: false,
        sticky: false,
      } satisfies FormatPainterMeta)
      changed = true
    }

    if (!changed) return false
    dispatch?.(tr)
    return true
  }
}

export function toggleFormatPainter(
  options: FormatPainterOptions & { sticky?: boolean } = {},
): Command {
  const resolved = resolveOptions(options)
  return (state, dispatch) => {
    const pluginState = getFormatPainterState(state)
    const sticky = options.sticky ?? false

    if (pluginState.active && pluginState.sticky === sticky) {
      dispatch?.(
        state.tr.setMeta(formatPainterPluginKey, {
          active: false,
          sticky: false,
        } satisfies FormatPainterMeta),
      )
      return true
    }

    if (pluginState.active) {
      dispatch?.(
        state.tr.setMeta(formatPainterPluginKey, {
          active: true,
          sticky,
        } satisfies FormatPainterMeta),
      )
      return true
    }

    const sample = createFormatSample(state, resolved)
    if (!sample) return false

    dispatch?.(
      state.tr.setMeta(formatPainterPluginKey, {
        active: true,
        sticky,
        sample,
      } satisfies FormatPainterMeta),
    )
    return true
  }
}

export function copyFormatForView(
  view: EditorView,
  options?: FormatPainterOptions,
): boolean {
  return copyFormat(options)(view.state, view.dispatch, view)
}

export function applyFormatForView(
  view: EditorView,
  options?: FormatPainterOptions,
): boolean {
  return applyFormat(options)(view.state, view.dispatch, view)
}

export function toggleFormatPainterForView(
  view: EditorView,
  options?: FormatPainterOptions & { sticky?: boolean },
): boolean {
  return toggleFormatPainter(options)(view.state, view.dispatch, view)
}

export function clearFormatPainterForView(view: EditorView): boolean {
  return clearFormatPainter(view.state, view.dispatch, view)
}

export function getFormatSample(state: EditorState): FormatSample | null {
  return getFormatPainterState(state).sample
}

export function setFormatSample(
  view: EditorView,
  sample: FormatSample | null,
  options: { active?: boolean; sticky?: boolean } = {},
): boolean {
  const active = sample ? (options.active ?? true) : false

  view.dispatch(
    view.state.tr.setMeta(formatPainterPluginKey, {
      sample,
      active,
      sticky: active && (options.sticky ?? false),
    } satisfies FormatPainterMeta),
  )
  return true
}

function defineFormatPainterPlugin(options: ResolvedOptions): PlainExtension {
  return definePlugin(
    new ProseMirrorPlugin<FormatPainterState>({
      key: formatPainterPluginKey,
      state: {
        init: () => initialState,
        apply(tr, value) {
          const meta = tr.getMeta(formatPainterPluginKey) as
            | FormatPainterMeta
            | undefined

          if (!meta) return value

          return {
            active: meta.active ?? value.active,
            sticky: meta.sticky ?? value.sticky,
            sample: Object.hasOwn(meta, 'sample') ? meta.sample || null : value.sample,
          }
        },
      },
      props: {
        handleDOMEvents: {
          mouseup(view, event) {
            if (!options.interaction.applyOnMouseUp) return false
            if (!getFormatPainterState(view.state).active) return false
            if (view.composing) return false
            if (shouldIgnoreMouseEvent(view, event)) return false

            const schedule = view.dom.ownerDocument.defaultView?.setTimeout
            schedule?.(() => {
              if (getFormatPainterState(view.state).active) {
                applyFormat(options)(view.state, view.dispatch, view)
              }
            }, 0)

            return false
          },
        },
      },
      view(view) {
        syncDOMState(view)
        return {
          update: syncDOMState,
          destroy() {
            view.dom.removeAttribute('data-format-painter')
          },
        }
      },
    }),
  )
}

function applySampleToTransaction(
  tr: Transaction,
  state: EditorState,
  sample: FormatSample,
  options: ResolvedOptions,
): boolean {
  let changed = false

  if (sample.textblock) {
    changed = applyTextblockSample(tr, state, sample.textblock, options) || changed
  }

  if (options.wrappers.include.length > 0) {
    changed = applyWrapperSample(tr, state, sample.wrappers || [], options) || changed
  }

  changed = applyMarkSample(tr, state, sample.marks, options) || changed
  return changed
}

function applyWrapperSample(
  tr: Transaction,
  state: EditorState,
  wrappers: WrapperSample[],
  options: ResolvedOptions,
): boolean {
  const ranges = getSelectedTextblocks(state)
  let changed = false

  for (const range of ranges) {
    const originalPos = range.pos
    changed =
      removeConfiguredWrappersFromTextblock(tr, state, originalPos, options)
      || changed

    for (const wrapper of wrappers) {
      const attrs = getTargetWrapperAttrs(wrapper, options)
      const wrapped = runCommandOnTextblock(
        tr,
        state,
        originalPos,
        wrap({ type: wrapper.type, attrs }),
      )

      if (wrapped) {
        changed = true
      } else {
        const target = getTextblockAt(
          tr.doc,
          tr.mapping.map(originalPos),
        )
        options.onUnsupportedStyle?.(wrapperToUnsupportedStyle(wrapper), {
          reason: 'incompatible-wrapper',
          state,
          target: target
            ? { from: target.pos, to: target.pos + target.node.nodeSize }
            : { from: originalPos, to: originalPos },
        })
      }
    }
  }

  return changed
}

function applyMarkSample(
  tr: Transaction,
  state: EditorState,
  marks: MarkSample[],
  options: ResolvedOptions,
): boolean {
  const managedNames = getManagedMarkNames(state, options)
  const selection = state.selection

  if (selection.empty) {
    const currentMarks = state.storedMarks || selection.$from.marks()
    const sampleMarks = createMarks(state, marks, options, {
      from: selection.from,
      to: selection.to,
    })
    if (marks.length > 0 && sampleMarks.length === 0) return false

    if (options.marks.apply === 'merge') {
      tr.setStoredMarks(
        sampleMarks.reduce((result, mark) => mark.addToSet(result), currentMarks),
      )
      return true
    }

    const unmanagedMarks = currentMarks.filter(
      (mark) => !managedNames.includes(mark.type.name),
    )
    tr.setStoredMarks([...unmanagedMarks, ...sampleMarks])
    return true
  }

  const from = tr.mapping.map(selection.from)
  const to = tr.mapping.map(selection.to)

  if (options.marks.apply === 'replace') {
    for (const name of managedNames) {
      const markType = state.schema.marks[name]
      if (markType) {
        tr.removeMark(from, to, markType)
      }
    }
  }

  const sampleMarks = createMarks(state, marks, options, { from, to })
  if (marks.length > 0 && sampleMarks.length === 0) return false

  for (const mark of sampleMarks) {
    tr.addMark(from, to, mark)
  }

  return true
}

function applyTextblockSample(
  tr: Transaction,
  state: EditorState,
  sample: TextblockSample,
  options: ResolvedOptions,
): boolean {
  if (!sample.type && !sample.attrs) return false

  const ranges = getSelectedTextblocks(state)
  let changed = false

  for (const range of ranges) {
    const mappedPos = tr.mapping.map(range.pos)
    const currentNode = tr.doc.nodeAt(mappedPos)
    if (!currentNode?.isTextblock) continue

    const typeName = getTargetTextblockTypeName(currentNode, sample, options)
    const type = typeName ? state.schema.nodes[typeName] : currentNode.type
    if (!type) {
      if (typeName) {
        options.onUnsupportedStyle?.(
          { kind: 'textblock', type: typeName, attrs: sample.attrs },
          {
            reason: 'missing-textblock-type',
            state,
            target: { from: mappedPos, to: mappedPos + currentNode.nodeSize },
          },
        )
      }
      continue
    }

    const attrs = getTargetTextblockAttrs(currentNode, type.name, sample, options)

    try {
      tr.setNodeMarkup(mappedPos, type, attrs)
      changed = true
    } catch {
      options.onUnsupportedStyle?.(
        { kind: 'textblock', type: type.name, attrs },
        {
          reason: 'incompatible-textblock',
          state,
          target: { from: mappedPos, to: mappedPos + currentNode.nodeSize },
        },
      )
    }
  }

  return changed
}

function createFormatSample(
  state: EditorState,
  options: ResolvedOptions,
): FormatSample | null {
  const marks = getSampleMarks(state, options).map((mark) => ({
    type: mark.type.name,
    attrs: { ...mark.attrs },
  }))
  const textblock = getTextblockSample(state, options)
  const wrappers = getWrapperSample(state, options)

  return { marks, textblock, wrappers }
}

function getSampleMarks(
  state: EditorState,
  options: ResolvedOptions,
): readonly Mark[] {
  const selection = state.selection
  const marks = selection.empty
    ? state.storedMarks || selection.$from.marks()
    : getCommonSelectionMarks(state)

  return marks.filter((mark) => isManagedMark(mark.type.name, state, options))
}

function getCommonSelectionMarks(state: EditorState): readonly Mark[] {
  const { selection } = state
  let common: readonly Mark[] | undefined

  state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
    if (!node.isText) return true

    const from = Math.max(pos, selection.from)
    const to = Math.min(pos + node.nodeSize, selection.to)
    if (from >= to) return false

    common = common
      ? common.filter((mark) => node.marks.some((candidate) => candidate.eq(mark)))
      : node.marks
    return false
  })

  return common || selection.$from.marks()
}

function getTextblockSample(
  state: EditorState,
  options: ResolvedOptions,
): TextblockSample | undefined {
  const node = getSelectionTextblock(state)
  if (!node) return undefined

  const sample: TextblockSample = {}

  if (
    options.textblock.include.includes('blockType')
    && isIncludedTextblockType(node.type.name, options)
  ) {
    sample.type = node.type.name
  }

  if (options.textblock.include.includes('attrs')) {
    const attrs = filterTextblockAttrs(node.type.name, node.attrs, options)
    if (Object.keys(attrs).length > 0) {
      sample.attrs = attrs
    }
  }

  return sample.type || sample.attrs ? sample : undefined
}

function getWrapperSample(
  state: EditorState,
  options: ResolvedOptions,
): WrapperSample[] | undefined {
  if (options.wrappers.include.length === 0) return undefined
  if (!getSelectionTextblock(state)) return undefined

  const ancestors = getSelectionAncestors(state)
  const wrappers = ancestors
    .filter((node) => options.wrappers.include.includes(node.type.name))
    .map((node) => {
      const attrs = filterAttrs(node.attrs, options.wrappers.attrs[node.type.name])
      return {
        type: node.type.name,
        attrs: Object.keys(attrs).length > 0 ? attrs : undefined,
      }
    })

  return wrappers.length > 0 ? wrappers : undefined
}

function createMarks(
  state: EditorState,
  marks: MarkSample[],
  options: ResolvedOptions,
  target: FormatPainterTarget,
): Mark[] {
  const result: Mark[] = []

  for (const sample of marks) {
    if (!isManagedMark(sample.type, state, options)) continue

    const markType = state.schema.marks[sample.type]
    if (!markType) {
      options.onUnsupportedStyle?.(
        { kind: 'mark', type: sample.type, attrs: sample.attrs },
        { reason: 'missing-mark-type', state, target },
      )
      continue
    }

    try {
      result.push(markType.create(sample.attrs))
    } catch {
      options.onUnsupportedStyle?.(
        { kind: 'mark', type: sample.type, attrs: sample.attrs },
        { reason: 'invalid-mark-attrs', state, target },
      )
    }
  }

  return result
}

function getSelectedTextblocks(
  state: EditorState,
): Array<{ pos: number; node: ProseMirrorNode }> {
  const selection = state.selection
  const result: Array<{ pos: number; node: ProseMirrorNode }> = []

  if (selection.empty) {
    const found = findAncestorTextblock(selection.$from)
    if (found) return [found]
  }

  state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
    if (node.isTextblock) {
      result.push({ pos, node })
      return false
    }
    return true
  })

  return result
}

function getSelectionTextblock(state: EditorState): ProseMirrorNode | undefined {
  const { selection } = state
  const from = findAncestorTextblock(selection.$from)
  if (!from || selection.empty) return from?.node

  const to = findAncestorTextblock(state.doc.resolve(selection.to - 1))
  return to?.pos === from.pos ? from.node : undefined
}

function getSelectionAncestors(state: EditorState): ProseMirrorNode[] {
  const ancestors: ProseMirrorNode[] = []
  const $from = state.selection.$from

  for (let depth = 1; depth <= $from.depth; depth += 1) {
    const node = $from.node(depth)
    if (!node.isTextblock) ancestors.push(node)
  }

  return ancestors
}

function getTextblockAt(
  doc: ProseMirrorNode,
  pos: number,
): { pos: number; node: ProseMirrorNode } | undefined {
  const resolvedPos = Math.min(Math.max(pos + 1, 0), doc.content.size)
  const $pos = doc.resolve(resolvedPos)

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth)
    if (node.isTextblock) {
      return { pos: $pos.before(depth), node }
    }
  }

  return undefined
}

function getTextblockAncestorNames(
  doc: ProseMirrorNode,
  pos: number,
): string[] {
  const resolvedPos = Math.min(Math.max(pos + 1, 0), doc.content.size)
  const $pos = doc.resolve(resolvedPos)
  const names: string[] = []

  for (let depth = 1; depth <= $pos.depth; depth += 1) {
    const node = $pos.node(depth)
    if (!node.isTextblock) names.push(node.type.name)
  }

  return names
}

function hasConfiguredWrapperAt(
  tr: Transaction,
  originalTextblockPos: number,
  options: ResolvedOptions,
): boolean {
  const mappedPos = tr.mapping.map(originalTextblockPos)
  return getTextblockAncestorNames(tr.doc, mappedPos).some((name) =>
    options.wrappers.include.includes(name),
  )
}

function removeConfiguredWrappersFromTextblock(
  tr: Transaction,
  state: EditorState,
  originalTextblockPos: number,
  options: ResolvedOptions,
): boolean {
  let changed = false

  for (let count = 0; count < options.wrappers.include.length; count += 1) {
    if (!hasConfiguredWrapperAt(tr, originalTextblockPos, options)) break
    if (!runCommandOnTextblock(tr, state, originalTextblockPos, lift)) break
    changed = true
  }

  return changed
}

function runCommandOnTextblock(
  tr: Transaction,
  state: EditorState,
  originalTextblockPos: number,
  command: Command,
): boolean {
  const mappedPos = tr.mapping.map(originalTextblockPos)
  const textblock = getTextblockAt(tr.doc, mappedPos)
  if (!textblock) return false

  const from = textblock.pos + 1
  const to = textblock.pos + textblock.node.nodeSize - 1
  const selection = TextSelection.create(tr.doc, from, to)
  const tempState = EditorState.create({
    doc: tr.doc,
    selection,
    plugins: state.plugins,
  })
  let commandTr: Transaction | undefined
  const handled = command(tempState, (nextTr) => {
    commandTr = nextTr
  })

  if (!handled || !commandTr || commandTr.steps.length === 0) return false

  for (const step of commandTr.steps) {
    tr.step(step)
  }
  return true
}

function getTargetWrapperAttrs(
  wrapper: WrapperSample,
  options: ResolvedOptions,
): Attrs | null {
  const attrs = wrapper.attrs || {}
  const include = options.wrappers.attrs[wrapper.type]
  const copiedAttrs = filterAttrs(attrs, include)
  return Object.keys(copiedAttrs).length > 0 ? copiedAttrs : null
}

function findAncestorTextblock(
  $pos: EditorState['selection']['$from'],
): { pos: number; node: ProseMirrorNode } | undefined {
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth)
    if (node.isTextblock) {
      return { pos: $pos.before(depth), node }
    }
  }

  return undefined
}

function getTargetTextblockTypeName(
  node: ProseMirrorNode,
  sample: TextblockSample,
  options: ResolvedOptions,
): string | undefined {
  if (!sample.type) return undefined
  if (!options.textblock.include.includes('blockType')) return undefined
  if (!isIncludedTextblockType(sample.type, options)) return undefined
  if (!isIncludedTextblockType(node.type.name, options)) return undefined
  return sample.type
}

function getTargetTextblockAttrs(
  node: ProseMirrorNode,
  targetTypeName: string,
  sample: TextblockSample,
  options: ResolvedOptions,
): Attrs {
  const sampleAttrs = sample.attrs || {}
  const copiedAttrs = filterTextblockAttrs(targetTypeName, sampleAttrs, options)

  if (targetTypeName === node.type.name) {
    return { ...node.attrs, ...copiedAttrs }
  }

  return copiedAttrs
}

function filterTextblockAttrs(
  typeName: string,
  attrs: Attrs,
  options: ResolvedOptions,
): Attrs {
  const byType = options.textblock.attrs.byType[typeName]
  const include = byType || options.textblock.attrs.include
  return filterAttrs(attrs, include)
}

function filterAttrs(attrs: Attrs, include: string[] | undefined): Attrs {
  if (!include || include.length === 0) return {}

  const result: Record<string, unknown> = {}
  for (const key of include) {
    if (Object.hasOwn(attrs, key)) {
      result[key] = attrs[key]
    }
  }
  return result
}

function isIncludedTextblockType(
  typeName: string,
  options: ResolvedOptions,
): boolean {
  const include = options.textblock.blockTypes.include
  return include.length === 0 || include.includes(typeName)
}

function getManagedMarkNames(
  state: EditorState,
  options: ResolvedOptions,
): string[] {
  return Object.keys(state.schema.marks).filter((name) =>
    isManagedMark(name, state, options),
  )
}

function isManagedMark(
  name: string,
  state: EditorState,
  options: ResolvedOptions,
): boolean {
  if (options.marks.exclude.includes(name)) return false
  if (options.marks.preserve.includes(name)) return false
  if (options.marks.filter && !options.marks.filter(name, { state })) {
    return false
  }
  return true
}

function wrapperToUnsupportedStyle(
  wrapper: WrapperSample,
): FormatPainterUnsupportedStyle {
  return { kind: 'wrapper', type: wrapper.type, attrs: wrapper.attrs }
}

function shouldIgnoreMouseEvent(view: EditorView, event: MouseEvent): boolean {
  const target = event.target
  if (!(target instanceof view.dom.ownerDocument.defaultView!.Node)) {
    return true
  }

  if (!view.dom.contains(target)) return true
  if (!(target instanceof view.dom.ownerDocument.defaultView!.Element)) {
    return false
  }

  return Boolean(target.closest('[data-format-painter-ignore]'))
}

function syncDOMState(view: EditorView): void {
  const state = getFormatPainterState(view.state)
  const value = state.active ? (state.sticky ? 'sticky' : 'active') : 'inactive'
  view.dom.setAttribute('data-format-painter', value)
}

function resolveOptions(options: FormatPainterOptions): ResolvedOptions {
  return {
    marks: {
      exclude: options.marks?.exclude || ['link'],
      preserve: options.marks?.preserve || [],
      apply: options.marks?.apply || 'replace',
      filter: options.marks?.filter,
    },
    textblock: {
      include: options.textblock?.include || [],
      blockTypes: {
        include: options.textblock?.blockTypes?.include || [],
      },
      attrs: {
        include: options.textblock?.attrs?.include || [],
        byType: options.textblock?.attrs?.byType || {},
      },
    },
    wrappers: {
      include: options.wrappers?.include || [],
      attrs: options.wrappers?.attrs || {},
    },
    interaction: {
      applyOnMouseUp: options.interaction?.applyOnMouseUp ?? true,
    },
    onUnsupportedStyle: options.onUnsupportedStyle,
  }
}
