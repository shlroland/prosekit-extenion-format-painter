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
import { defineFormatPainter } from 'prosekit-extension-format-painter'

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
}

const extension = union(
  defineBasicExtension(),
  defineFormatPainter(formatPainterOptions),
)
```

Bind your toolbar to the headless helpers:

```ts
import {
  getFormatPainterState,
  toggleFormatPainterForView,
} from 'prosekit-extension-format-painter'

button.addEventListener('mousedown', (event) => {
  event.preventDefault()
})

button.addEventListener('click', () => {
  toggleFormatPainterForView(editor.view, formatPainterOptions)
})

button.addEventListener('dblclick', () => {
  toggleFormatPainterForView(editor.view, {
    ...formatPainterOptions,
    sticky: true,
  })
})

const active = getFormatPainterState(editor.state).active
```

## MVP Scope

- Copies all schema marks by default, except `link`.
- Supports `exclude`, `preserve`, and `replace`/`merge` mark application.
- Supports textblock `blockType` and selected attrs through explicit `include`
  configuration.
- Supports one-shot and sticky painter states.
- Applies automatically on editor `mouseup`.
- Clears with `Escape`.
- Adds `data-format-painter="inactive|active|sticky"` to the editor DOM.
- Keeps wrapper/list configuration reserved for a later implementation.

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
