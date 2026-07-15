import { defineBasicExtension } from '@prosekit/basic'
import { union } from '@prosekit/core'
import { createTestEditor } from '@prosekit/core/test'
import { defineTextAlign } from '@prosekit/extensions/text-align'
import { TextSelection } from '@prosekit/pm/state'
import { expect, it } from 'vitest'

import {
  applyFormatForView,
  copyFormatForView,
  createFormatPainter,
  defaultFormatPainterOptions,
  defineFormatPainter,
  blockFormatPainterOptions,
  getFormatPainterState,
  toggleFormatPainterForView,
} from '../src/index.ts'

import { getTestContainerDiv } from './utils.ts'

function setupEditor(options: Parameters<typeof defineFormatPainter>[0] = {}) {
  return setupEditorWithFormatPainterExtension(defineFormatPainter(options))
}

function setupEditorWithFormatPainterExtension(
  formatPainterExtension: ReturnType<typeof defineFormatPainter>,
) {
  const extension = union(
    defineBasicExtension(),
    defineTextAlign({ types: ['paragraph', 'heading'] }),
    formatPainterExtension,
  )
  const editor = createTestEditor({ extension })
  editor.mount(getTestContainerDiv())
  return editor
}

function setTextSelection(
  editor: ReturnType<typeof setupEditor>,
  from: number,
  to = from,
) {
  editor.view.dispatch(
    editor.state.tr.setSelection(TextSelection.create(editor.state.doc, from, to)),
  )
}

function markNamesAt(doc: ReturnType<typeof setupEditor>['state']['doc'], pos: number) {
  return doc
    .resolve(pos)
    .marks()
    .map((mark) => mark.type.name)
    .sort()
}

function findTextRange(
  editor: ReturnType<typeof setupEditor>,
  text: string,
): [number, number] {
  let range: [number, number] | undefined

  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text === text) {
      range = [pos, pos + text.length]
      return false
    }
    return true
  })

  if (!range) throw new Error(`Failed to find text: ${text}`)
  return range
}

it('stores a sample and exposes active state on the editor DOM', () => {
  const editor = setupEditor()
  const n = editor.nodes
  const m = editor.marks

  editor.set(n.doc(n.paragraph(m.bold('foo'))))
  setTextSelection(editor, 1, 4)

  expect(copyFormatForView(editor.view)).toBe(true)

  expect(getFormatPainterState(editor.state)).toMatchObject({
    active: true,
    sticky: false,
  })
  expect(editor.view.dom.getAttribute('data-format-painter')).toBe('active')

  editor.unmount()
})

it('exports safe inline defaults and an opt-in block preset', () => {
  expect(defaultFormatPainterOptions).toMatchObject({
    marks: { exclude: ['link'], apply: 'replace' },
    textblock: { include: [] },
    wrappers: { include: [] },
    interaction: { applyOnMouseUp: true },
  })
  expect(blockFormatPainterOptions).toMatchObject({
    textblock: { include: ['blockType', 'attrs'] },
    wrappers: { include: ['blockquote', 'list'] },
  })
})

it('copies a blockquote wrapper to a plain textblock', () => {
  const formatPainter = createFormatPainter({
    wrappers: { include: ['blockquote'] },
  })
  const editor = setupEditorWithFormatPainterExtension(formatPainter.extension)
  const n = editor.nodes

  editor.set(
    n.doc(
      n.blockquote(n.paragraph('Quoted')),
      n.paragraph('Plain'),
    ),
  )

  setTextSelection(editor, ...findTextRange(editor, 'Quoted'))
  expect(formatPainter.copyFormatForView(editor.view)).toBe(true)

  setTextSelection(editor, ...findTextRange(editor, 'Plain'))
  expect(formatPainter.applyFormatForView(editor.view)).toBe(true)

  expect(editor.state.doc.toJSON()).toMatchInlineSnapshot(`
    {
      "content": [
        {
          "content": [
            {
              "attrs": {
                "textAlign": "left",
              },
              "content": [
                {
                  "text": "Quoted",
                  "type": "text",
                },
              ],
              "type": "paragraph",
            },
          ],
          "type": "blockquote",
        },
        {
          "content": [
            {
              "attrs": {
                "textAlign": "left",
              },
              "content": [
                {
                  "text": "Plain",
                  "type": "text",
                },
              ],
              "type": "paragraph",
            },
          ],
          "type": "blockquote",
        },
      ],
      "type": "doc",
    }
  `)

  editor.unmount()
})

it('removes configured wrappers when the sample has none', () => {
  const formatPainter = createFormatPainter({
    wrappers: { include: ['blockquote'] },
  })
  const editor = setupEditorWithFormatPainterExtension(formatPainter.extension)
  const n = editor.nodes

  editor.set(
    n.doc(
      n.paragraph('Plain'),
      n.blockquote(n.paragraph('Quoted')),
    ),
  )

  setTextSelection(editor, ...findTextRange(editor, 'Plain'))
  expect(formatPainter.copyFormatForView(editor.view)).toBe(true)

  setTextSelection(editor, ...findTextRange(editor, 'Quoted'))
  expect(formatPainter.applyFormatForView(editor.view)).toBe(true)

  expect(editor.state.doc.toJSON()).toMatchInlineSnapshot(`
    {
      "content": [
        {
          "attrs": {
            "textAlign": "left",
          },
          "content": [
            {
              "text": "Plain",
              "type": "text",
            },
          ],
          "type": "paragraph",
        },
        {
          "attrs": {
            "textAlign": "left",
          },
          "content": [
            {
              "text": "Quoted",
              "type": "text",
            },
          ],
          "type": "paragraph",
        },
      ],
      "type": "doc",
    }
  `)

  editor.unmount()
})

it('keeps target wrappers when a sampled wrapper is unsupported', () => {
  const unsupported: string[] = []
  const formatPainter = createFormatPainter({
    wrappers: { include: ['blockquote'] },
    onUnsupportedStyle(style, context) {
      unsupported.push(`${style.type}:${context.reason}`)
    },
  })
  const editor = setupEditorWithFormatPainterExtension(formatPainter.extension)
  const n = editor.nodes

  editor.set(n.doc(n.blockquote(n.paragraph('Target'))))
  setTextSelection(editor, ...findTextRange(editor, 'Target'))
  formatPainter.setSample(editor.view, {
    marks: [],
    wrappers: [{ type: 'missingWrapper' }],
  })

  expect(formatPainter.applyFormatForView(editor.view)).toBe(false)
  expect(editor.state.doc.child(0).type.name).toBe('blockquote')
  expect(formatPainter.isActive(editor.state)).toBe(true)
  expect(unsupported).toEqual(['missingWrapper:incompatible-wrapper'])

  editor.unmount()
})

it('copies ProseKit flat list wrapper attrs', () => {
  const formatPainter = createFormatPainter({
    wrappers: {
      include: ['list'],
      attrs: { list: ['kind', 'order'] },
    },
  })
  const editor = setupEditorWithFormatPainterExtension(formatPainter.extension)
  const n = editor.nodes

  editor.set(
    n.doc(
      n.list({ kind: 'ordered', order: 3 }, n.paragraph('One')),
      n.paragraph('Two'),
    ),
  )

  setTextSelection(editor, ...findTextRange(editor, 'One'))
  expect(formatPainter.copyFormatForView(editor.view)).toBe(true)

  setTextSelection(editor, ...findTextRange(editor, 'Two'))
  expect(formatPainter.applyFormatForView(editor.view)).toBe(true)

  expect(editor.state.doc.toJSON()).toMatchInlineSnapshot(`
    {
      "content": [
        {
          "attrs": {
            "checked": false,
            "collapsed": false,
            "kind": "ordered",
            "order": 3,
          },
          "content": [
            {
              "attrs": {
                "textAlign": "left",
              },
              "content": [
                {
                  "text": "One",
                  "type": "text",
                },
              ],
              "type": "paragraph",
            },
          ],
          "type": "list",
        },
        {
          "attrs": {
            "checked": false,
            "collapsed": false,
            "kind": "ordered",
            "order": 3,
          },
          "content": [
            {
              "attrs": {
                "textAlign": "left",
              },
              "content": [
                {
                  "text": "Two",
                  "type": "text",
                },
              ],
              "type": "paragraph",
            },
          ],
          "type": "list",
        },
      ],
      "type": "doc",
    }
  `)

  editor.unmount()
})

it('copies nested wrappers from inner to outer structure', () => {
  const formatPainter = createFormatPainter({
    wrappers: {
      include: ['blockquote', 'list'],
      attrs: { list: ['kind', 'order'] },
    },
  })
  const editor = setupEditorWithFormatPainterExtension(formatPainter.extension)
  const n = editor.nodes

  editor.set(
    n.doc(
      n.blockquote(
        n.list({ kind: 'ordered', order: 3 }, n.paragraph('Source')),
      ),
      n.paragraph('Target'),
    ),
  )

  setTextSelection(editor, ...findTextRange(editor, 'Source'))
  expect(formatPainter.copyFormatForView(editor.view)).toBe(true)

  setTextSelection(editor, ...findTextRange(editor, 'Target'))
  expect(formatPainter.applyFormatForView(editor.view)).toBe(true)

  const target = editor.state.doc.child(1)
  expect(target.type.name).toBe('blockquote')
  expect(target.firstChild?.type.name).toBe('list')
  expect(target.firstChild?.attrs).toMatchObject({ kind: 'ordered', order: 3 })

  editor.unmount()
})

it('replaces managed marks while preserving excluded link marks', () => {
  const editor = setupEditor()
  const n = editor.nodes
  const m = editor.marks

  editor.set(
    n.doc(
      n.paragraph(
        m.bold('foo'),
        ' ',
        m.italic(m.link({ href: 'https://example.com' }, 'bar')),
      ),
    ),
  )

  setTextSelection(editor, 1, 4)
  expect(copyFormatForView(editor.view)).toBe(true)

  setTextSelection(editor, 5, 8)
  expect(applyFormatForView(editor.view)).toBe(true)

  expect(markNamesAt(editor.state.doc, 6)).toEqual(['bold', 'link'])
  expect(getFormatPainterState(editor.state).active).toBe(false)

  editor.unmount()
})

it('samples only common inline marks from a mixed source selection', () => {
  const editor = setupEditor()
  const n = editor.nodes
  const m = editor.marks

  editor.set(
    n.doc(
      n.paragraph(
        m.bold(m.italic('One')),
        m.bold(' two'),
        ' target',
      ),
    ),
  )

  setTextSelection(editor, 1, 8)
  expect(copyFormatForView(editor.view)).toBe(true)

  setTextSelection(editor, 9, 15)
  expect(applyFormatForView(editor.view)).toBe(true)

  expect(markNamesAt(editor.state.doc, 10)).toEqual(['bold'])

  editor.unmount()
})

it('merges sampled marks with existing target marks when configured', () => {
  const editor = setupEditor({ marks: { apply: 'merge' } })
  const n = editor.nodes
  const m = editor.marks

  editor.set(n.doc(n.paragraph(m.bold('foo'), ' ', m.italic('bar'))))

  setTextSelection(editor, 1, 4)
  expect(copyFormatForView(editor.view, { marks: { apply: 'merge' } })).toBe(
    true,
  )

  setTextSelection(editor, 5, 8)
  expect(applyFormatForView(editor.view, { marks: { apply: 'merge' } })).toBe(
    true,
  )

  expect(markNamesAt(editor.state.doc, 6)).toEqual(['bold', 'italic'])

  editor.unmount()
})

it('keeps preserved marks on the target while applying sampled marks', () => {
  const options = { marks: { preserve: ['italic'] } }
  const editor = setupEditor(options)
  const n = editor.nodes
  const m = editor.marks

  editor.set(n.doc(n.paragraph(m.bold('foo'), ' ', m.italic('bar'))))

  setTextSelection(editor, 1, 4)
  expect(copyFormatForView(editor.view, options)).toBe(true)

  setTextSelection(editor, 5, 8)
  expect(applyFormatForView(editor.view, options)).toBe(true)

  expect(markNamesAt(editor.state.doc, 6)).toEqual(['bold', 'italic'])

  editor.unmount()
})

it('uses the mark filter for sampling and applying marks', () => {
  const options = {
    marks: {
      filter: (markName: string) => markName !== 'italic',
    },
  }
  const editor = setupEditor(options)
  const n = editor.nodes
  const m = editor.marks

  editor.set(n.doc(n.paragraph(m.bold(m.italic('foo')), ' bar')))

  setTextSelection(editor, 1, 4)
  expect(copyFormatForView(editor.view, options)).toBe(true)

  setTextSelection(editor, 5, 8)
  expect(applyFormatForView(editor.view, options)).toBe(true)

  expect(markNamesAt(editor.state.doc, 6)).toEqual(['bold'])

  editor.unmount()
})

it('writes sampled marks to storedMarks for a collapsed target selection', () => {
  const editor = setupEditor()
  const n = editor.nodes
  const m = editor.marks

  editor.set(n.doc(n.paragraph(m.bold('foo'), ' bar')))
  setTextSelection(editor, 1, 4)
  expect(copyFormatForView(editor.view)).toBe(true)

  setTextSelection(editor, 8)
  expect(applyFormatForView(editor.view)).toBe(true)

  expect(editor.state.storedMarks?.map((mark) => mark.type.name)).toEqual([
    'bold',
  ])

  editor.unmount()
})

it('merges sampled marks with stored marks at a collapsed target selection', () => {
  const options = {
    marks: { apply: 'merge' },
  } satisfies Parameters<typeof defineFormatPainter>[0]
  const editor = setupEditor(options)
  const n = editor.nodes
  const m = editor.marks

  editor.set(n.doc(n.paragraph(m.bold('foo'), ' ', m.italic('bar'))))
  setTextSelection(editor, 1, 4)
  expect(copyFormatForView(editor.view, options)).toBe(true)

  setTextSelection(editor, 6)
  expect(applyFormatForView(editor.view, options)).toBe(true)

  expect(editor.state.storedMarks?.map((mark) => mark.type.name).sort()).toEqual([
    'bold',
    'italic',
  ])

  editor.unmount()
})

it('does not apply on mouseup when automatic mouseup interaction is disabled', async () => {
  const options = { interaction: { applyOnMouseUp: false } }
  const editor = setupEditor(options)
  const n = editor.nodes
  const m = editor.marks

  editor.set(n.doc(n.paragraph(m.bold('foo'), ' bar')))
  setTextSelection(editor, 1, 4)
  expect(copyFormatForView(editor.view, options)).toBe(true)

  setTextSelection(editor, 5, 8)
  editor.view.dom.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  await new Promise((resolve) => setTimeout(resolve, 10))

  expect(markNamesAt(editor.state.doc, 6)).toEqual([])
  expect(getFormatPainterState(editor.state).active).toBe(true)

  editor.unmount()
})

it('clears active format painter state when Escape is pressed', () => {
  const editor = setupEditor()
  const n = editor.nodes
  const m = editor.marks

  editor.set(n.doc(n.paragraph(m.bold('foo'))))
  setTextSelection(editor, 1, 4)
  expect(copyFormatForView(editor.view)).toBe(true)

  editor.view.dom.dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
  )

  expect(getFormatPainterState(editor.state)).toMatchObject({
    active: false,
    sticky: false,
  })
  expect(editor.view.dom.getAttribute('data-format-painter')).toBe('inactive')

  editor.unmount()
})

it('reports unsupported sampled styles through the callback', () => {
  const unsupportedStyles: string[] = []
  const formatPainter = createFormatPainter({
    onUnsupportedStyle(style, context) {
      unsupportedStyles.push(
        `${style.kind}:${style.type}:${context.reason}:${context.target.from}-${context.target.to}`,
      )
    },
  })
  const editor = setupEditorWithFormatPainterExtension(formatPainter.extension)
  const n = editor.nodes

  editor.set(n.doc(n.paragraph('foo')))
  setTextSelection(editor, 1, 4)
  expect(
    formatPainter.setSample(editor.view, {
      marks: [{ type: 'missingMark', attrs: {} }],
    }),
  ).toBe(true)

  expect(formatPainter.applyFormatForView(editor.view)).toBe(false)

  expect(unsupportedStyles).toEqual([
    'mark:missingMark:missing-mark-type:1-4',
  ])
  expect(formatPainter.isActive(editor.state)).toBe(true)

  editor.unmount()
})

it('keeps the painter inactive when its sample is cleared', () => {
  const formatPainter = createFormatPainter()
  const editor = setupEditorWithFormatPainterExtension(formatPainter.extension)

  expect(
    formatPainter.setSample(editor.view, null, { active: true, sticky: true }),
  ).toBe(true)

  expect(formatPainter.getState(editor.state)).toEqual({
    active: false,
    sticky: false,
    sample: null,
  })
  expect(editor.view.dom.getAttribute('data-format-painter')).toBe('inactive')

  editor.unmount()
})

it('copies included textblock type and attrs after converting the block type', () => {
  const options = {
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
  } satisfies Parameters<typeof defineFormatPainter>[0]
  const formatPainter = createFormatPainter(options)
  const editor = setupEditorWithFormatPainterExtension(formatPainter.extension)
  const n = editor.nodes

  editor.set(
    n.doc(
      n.heading({ level: 2, textAlign: 'center' }, 'Title'),
      n.paragraph({ textAlign: 'left' }, 'Body'),
    ),
  )

  setTextSelection(editor, 2)
  expect(formatPainter.copyFormatForView(editor.view)).toBe(true)

  setTextSelection(editor, 9)
  expect(formatPainter.applyFormatForView(editor.view)).toBe(true)

  expect(editor.state.doc.toJSON()).toMatchInlineSnapshot(`
    {
      "content": [
        {
          "attrs": {
            "level": 2,
            "textAlign": "center",
          },
          "content": [
            {
              "text": "Title",
              "type": "text",
            },
          ],
          "type": "heading",
        },
        {
          "attrs": {
            "level": 2,
            "textAlign": "center",
          },
          "content": [
            {
              "text": "Body",
              "type": "text",
            },
          ],
          "type": "heading",
        },
      ],
      "type": "doc",
    }
  `)

  editor.unmount()
})

it('applies a textblock sample to every selected textblock', () => {
  const options = {
    textblock: {
      include: ['blockType', 'attrs'],
      blockTypes: { include: ['paragraph', 'heading'] },
      attrs: {
        byType: {
          heading: ['level', 'textAlign'],
        },
      },
    },
  } satisfies Parameters<typeof defineFormatPainter>[0]
  const formatPainter = createFormatPainter(options)
  const editor = setupEditorWithFormatPainterExtension(formatPainter.extension)
  const n = editor.nodes

  editor.set(
    n.doc(
      n.heading({ level: 2, textAlign: 'center' }, 'Source'),
      n.paragraph('First target'),
      n.paragraph('Second target'),
    ),
  )

  setTextSelection(editor, ...findTextRange(editor, 'Source'))
  expect(formatPainter.copyFormatForView(editor.view)).toBe(true)

  const [from] = findTextRange(editor, 'First target')
  const [, to] = findTextRange(editor, 'Second target')
  setTextSelection(editor, from, to)
  expect(formatPainter.applyFormatForView(editor.view)).toBe(true)

  for (const index of [1, 2]) {
    const target = editor.state.doc.child(index)
    expect(target.type.name).toBe('heading')
    expect(target.attrs).toMatchObject({ level: 2, textAlign: 'center' })
  }

  editor.unmount()
})

it('does not sample block format from a cross-block source selection', () => {
  const options = {
    textblock: {
      include: ['blockType'],
      blockTypes: { include: ['paragraph', 'heading'] },
    },
  } satisfies Parameters<typeof defineFormatPainter>[0]
  const formatPainter = createFormatPainter(options)
  const editor = setupEditorWithFormatPainterExtension(formatPainter.extension)
  const n = editor.nodes

  editor.set(
    n.doc(
      n.heading({ level: 2, textAlign: 'center' }, 'Heading source'),
      n.paragraph('Paragraph source'),
      n.paragraph('Target'),
    ),
  )

  const [from] = findTextRange(editor, 'Heading source')
  const [, to] = findTextRange(editor, 'Paragraph source')
  setTextSelection(editor, from, to)
  expect(formatPainter.copyFormatForView(editor.view)).toBe(true)

  setTextSelection(editor, ...findTextRange(editor, 'Target'))
  expect(formatPainter.applyFormatForView(editor.view)).toBe(true)

  expect(editor.state.doc.child(2).type.name).toBe('paragraph')

  editor.unmount()
})

it('keeps sticky mode active after applying a sample', () => {
  const editor = setupEditor()
  const n = editor.nodes
  const m = editor.marks

  editor.set(n.doc(n.paragraph(m.bold('foo'), ' bar')))
  setTextSelection(editor, 1, 4)

  expect(toggleFormatPainterForView(editor.view, { sticky: true })).toBe(true)
  expect(getFormatPainterState(editor.state)).toMatchObject({
    active: true,
    sticky: true,
  })

  setTextSelection(editor, 5, 8)
  expect(applyFormatForView(editor.view)).toBe(true)

  expect(getFormatPainterState(editor.state)).toMatchObject({
    active: true,
    sticky: true,
  })

  editor.unmount()
})

it('preserves the active sample when changing painter lifecycle', () => {
  const editor = setupEditor()
  const n = editor.nodes
  const m = editor.marks

  editor.set(
    n.doc(
      n.paragraph(
        m.bold('Source'),
        ' ',
        m.italic('Other'),
        ' ',
        m.link({ href: 'https://example.com' }, 'Target'),
      ),
    ),
  )
  setTextSelection(editor, ...findTextRange(editor, 'Source'))
  expect(copyFormatForView(editor.view)).toBe(true)

  setTextSelection(editor, ...findTextRange(editor, 'Other'))
  expect(toggleFormatPainterForView(editor.view, { sticky: true })).toBe(true)

  setTextSelection(editor, ...findTextRange(editor, 'Target'))
  expect(applyFormatForView(editor.view)).toBe(true)
  expect(
    markNamesAt(editor.state.doc, findTextRange(editor, 'Target')[0] + 1),
  ).toEqual(['bold', 'link'])

  editor.unmount()
})

it('automatically applies the active sample on editor mouseup', async () => {
  const editor = setupEditor()
  const n = editor.nodes
  const m = editor.marks

  editor.set(n.doc(n.paragraph(m.bold('foo'), ' bar')))
  setTextSelection(editor, 1, 4)
  expect(copyFormatForView(editor.view)).toBe(true)

  setTextSelection(editor, 5, 8)
  editor.view.dom.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  await new Promise((resolve) => setTimeout(resolve, 10))

  expect(markNamesAt(editor.state.doc, 6)).toEqual(['bold'])
  expect(getFormatPainterState(editor.state).active).toBe(false)

  editor.unmount()
})
