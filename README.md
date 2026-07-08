# prosekit-extension-format-painter

A headless [ProseKit](https://prosekit.dev) extension for Word-style format
painter interactions.

The extension stores a sampled format in ProseMirror plugin state, exposes
commands/helpers for toolbar integrations, applies the sampled format on editor
mouseup, and marks the editor DOM with `data-format-painter` for minimal cursor
styling.

## Install

```bash
pnpm add prosekit-extension-format-painter
```

## Usage

```ts
import 'prosekit-extension-format-painter/style.css'

import { defineBasicExtension } from '@prosekit/basic'
import { union } from '@prosekit/core'
import { createFormatPainter } from 'prosekit-extension-format-painter'

const formatPainterOptions = {
  marks: {
    exclude: ['link'],
    preserve: ['comment', 'suggestion'],
    apply: 'replace',
  },
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
}

const formatPainter = createFormatPainter(formatPainterOptions)

const extension = union(
  defineBasicExtension(),
  formatPainter.extension,
)
```

Bind your toolbar to the headless helpers:

```ts
button.addEventListener('mousedown', (event) => {
  event.preventDefault()
})

button.addEventListener('click', () => {
  formatPainter.toggleFormatPainterForView(editor.view)
})

button.addEventListener('dblclick', () => {
  formatPainter.toggleFormatPainterForView(editor.view, { sticky: true })
})

const active = formatPainter.getState(editor.state).active
```

`defineFormatPainter(options)` and the standalone command/view helpers are still
exported for lower-level integrations. Prefer `createFormatPainter(options)`
when an app has one shared options object.

## MVP Scope

- Copies all schema marks by default, except `link`.
- Supports `exclude`, `preserve`, and `replace`/`merge` mark application.
- Supports textblock `blockType` and selected attrs through explicit `include`
  configuration.
- Supports configured block wrappers, including `blockquote` and ProseKit's
  flat `list` node. List kind/order copying requires `attrs.list`.
- Supports one-shot and sticky painter states.
- Applies automatically on editor `mouseup`.
- Clears with `Escape`.
- Adds `data-format-painter="inactive|active|sticky"` to the editor DOM.

## Development

```bash
pnpm install
pnpm dev
pnpm test -- --run
pnpm lint
pnpm typecheck
pnpm build
```

The demo runs at `http://localhost:5173/` and uses a React toolbar with
shadcn-style controls. The published extension itself is framework agnostic.
