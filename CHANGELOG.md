# Changelog

## 1.0.0 (2026-07-14)

### Features

- Add a headless ProseKit format painter extension with one-shot and sticky modes.
- Support configurable marks, textblocks, wrappers, cursor state, and unsupported-style reporting.

### Bug Fixes

- Preserve existing marks when `marks.apply` is `merge` at a collapsed selection.
- Keep format painter state inactive when its sample is cleared.
