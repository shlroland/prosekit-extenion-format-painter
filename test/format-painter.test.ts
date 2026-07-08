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
  defineFormatPainter,
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
