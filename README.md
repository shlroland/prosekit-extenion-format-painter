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

import {
  blockFormatPainterOptions,
  createFormatPainter,
  defaultFormatPainterOptions,
} from 'prosekit-extension-format-painter'
import { defineBasicExtension } from 'prosekit/basic'
import { union } from 'prosekit/core'

const formatPainter = createFormatPainter(defaultFormatPainterOptions)

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

## Default behavior

- Uses safe inline mode: copies common inline marks from a source selection and preserves target links.
- Cross-block source selections copy inline format only; block format is sampled only from a single textblock.
- Applies once by default, or stays active in sticky mode.
- Keeps a one-shot painter active when no sampled format can be applied.

## Presets

`defaultFormatPainterOptions` is the safe inline default. Use `blockFormatPainterOptions` to opt into ProseKit Basic block formatting (headings, quotes, and lists; alignment is copied when `defineTextAlign()` is enabled):

```ts
const formatPainter = createFormatPainter(blockFormatPainterOptions)
```

For custom schemas, pass explicit options. Use `marks.preserve` for schema-specific protected marks such as comments or suggestions.

## Behavior and unsupported styles

- Mixed source selections copy only their common inline marks.
- Changing an active painter between one-shot and sticky preserves its format sample.
- `onUnsupportedStyle` receives a stable reason and the affected target range for each unsupported style.

## Supported capabilities

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
