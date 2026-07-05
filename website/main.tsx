import '../src/style.css'
import './style.css'

import { defineBasicExtension } from '@prosekit/basic'
import { createEditor, union } from '@prosekit/core'
import { defineTextAlign } from '@prosekit/extensions/text-align'
import { setBlockType, toggleMark } from '@prosekit/pm/commands'
import type { EditorView } from '@prosekit/pm/view'
import {
  AlignCenter,
  AlignLeft,
  Bold,
  Heading2,
  Italic,
  Paintbrush,
  PaintbrushVertical,
  Pilcrow,
} from 'lucide-react'
import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import {
  defineFormatPainter,
  getFormatPainterState,
  toggleFormatPainterForView,
} from '../src/index.ts'

const formatPainterOptions = {
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

function defineEditorExtension() {
  return union(
    defineBasicExtension(),
    defineTextAlign({ types: ['paragraph', 'heading'] }),
    defineFormatPainter(formatPainterOptions),
  )
}

type EditorExtension = ReturnType<typeof defineEditorExtension>
type DemoEditor = ReturnType<typeof createEditor<EditorExtension>>

function Button({
  active,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
}) {
  return (
    <button
      className={`button ${active ? 'button-active' : ''} ${className}`}
      type="button"
      {...props}
    />
  )
}

function runCommand(
  editor: DemoEditor | null,
  command: (view: EditorView) => boolean,
  sync: () => void,
) {
  if (!editor) return
  command(editor.view)
  editor.focus()
  sync()
}

function App() {
  const editorRef = useRef<DemoEditor | null>(null)
  const editorElementRef = useRef<HTMLDivElement>(null)
  const [, forceUpdate] = useState(0)

  const sync = () => forceUpdate((value) => value + 1)
  const editor = editorRef.current
  const painterState = editor
    ? getFormatPainterState(editor.state)
    : { active: false, sticky: false, sample: null }

  useEffect(() => {
    const editorElement = editorElementRef.current
    if (!editorElement) return

    const nextEditor = createEditor<EditorExtension>({
      extension: defineEditorExtension(),
      defaultContent: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2, textAlign: 'center' },
            content: [
              {
                type: 'text',
                marks: [{ type: 'bold' }],
                text: 'Quarterly planning',
              },
            ],
          },
          {
            type: 'paragraph',
            attrs: { textAlign: 'left' },
            content: [
              { type: 'text', text: 'Source style: ' },
              {
                type: 'text',
                marks: [{ type: 'bold' }, { type: 'italic' }],
                text: 'bold italic emphasis',
              },
              { type: 'text', text: ' with centered heading settings above.' },
            ],
          },
          {
            type: 'paragraph',
            attrs: { textAlign: 'left' },
            content: [
              { type: 'text', text: 'Target paragraph: ' },
              { type: 'text', text: 'select this phrase and paint it.' },
            ],
          },
          {
            type: 'paragraph',
            attrs: { textAlign: 'left' },
            content: [
              { type: 'text', text: 'Another target for sticky mode.' },
            ],
          },
        ],
      },
    })

    nextEditor.mount(editorElement)
    editorRef.current = nextEditor
    sync()

    const updateSoon = () => window.setTimeout(sync, 20)
    editorElement.addEventListener('mouseup', updateSoon)
    editorElement.addEventListener('keyup', updateSoon)

    return () => {
      editorElement.removeEventListener('mouseup', updateSoon)
      editorElement.removeEventListener('keyup', updateSoon)
      nextEditor.unmount()
      editorRef.current = null
    }
  }, [])

  return (
    <main className="shell">
      <section className="workspace" aria-label="Format painter demo">
        <aside className="panel">
          <div className="brand">
            <div>
              <p className="eyebrow">prosekit-extension-format-painter</p>
              <h1>Format painter</h1>
            </div>
            <span
              className={`status ${painterState.active ? 'status-on' : ''}`}
            >
              {painterState.sticky
                ? 'Sticky'
                : painterState.active
                  ? 'Active'
                  : 'Idle'}
            </span>
          </div>

          <div className="toolbar" data-format-painter-ignore>
            <Button
              aria-label="Bold"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                runCommand(
                  editor,
                  (view) =>
                    toggleMark(view.state.schema.marks.bold)(
                      view.state,
                      view.dispatch,
                      view,
                    ),
                  sync,
                )
              }
            >
              <Bold size={16} />
            </Button>
            <Button
              aria-label="Italic"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                runCommand(
                  editor,
                  (view) =>
                    toggleMark(view.state.schema.marks.italic)(
                      view.state,
                      view.dispatch,
                      view,
                    ),
                  sync,
                )
              }
            >
              <Italic size={16} />
            </Button>
            <Button
              aria-label="Paragraph"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                runCommand(
                  editor,
                  (view) =>
                    setBlockType(view.state.schema.nodes.paragraph)(
                      view.state,
                      view.dispatch,
                      view,
                    ),
                  sync,
                )
              }
            >
              <Pilcrow size={16} />
            </Button>
            <Button
              aria-label="Heading 2"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                runCommand(
                  editor,
                  (view) =>
                    setBlockType(view.state.schema.nodes.heading, { level: 2 })(
                      view.state,
                      view.dispatch,
                      view,
                    ),
                  sync,
                )
              }
            >
              <Heading2 size={16} />
            </Button>
            <Button
              aria-label="Align left"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                editor?.commands.setTextAlign('left') && sync()
              }
            >
              <AlignLeft size={16} />
            </Button>
            <Button
              aria-label="Align center"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                editor?.commands.setTextAlign('center') && sync()
              }
            >
              <AlignCenter size={16} />
            </Button>
          </div>

          <div className="toolbar toolbar-painter" data-format-painter-ignore>
            <Button
              active={painterState.active && !painterState.sticky}
              aria-label="Format painter"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (editor) {
                  toggleFormatPainterForView(editor.view, formatPainterOptions)
                  sync()
                }
              }}
              onDoubleClick={() => {
                if (editor) {
                  toggleFormatPainterForView(editor.view, {
                    ...formatPainterOptions,
                    sticky: true,
                  })
                  sync()
                }
              }}
            >
              <Paintbrush size={16} />
              <span>Paint</span>
            </Button>
            <Button
              active={painterState.sticky}
              aria-label="Sticky format painter"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (editor) {
                  toggleFormatPainterForView(editor.view, {
                    ...formatPainterOptions,
                    sticky: true,
                  })
                  sync()
                }
              }}
            >
              <PaintbrushVertical size={16} />
              <span>Lock</span>
            </Button>
          </div>
        </aside>

        <section className="editor-frame">
          <div ref={editorElementRef} className="editor-host" />
        </section>
      </section>
    </main>
  )
}

const rootElement = document.querySelector('#app')
if (!rootElement) throw new Error('Failed to find #app')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
