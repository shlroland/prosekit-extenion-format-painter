# Changelog

## 2.0.0 (2026-07-15)

### Breaking Changes

- Remove the unused `marks.mode` option.

### Features

- Export safe inline and ProseKit Basic block format painter presets.
- Sample common inline format from mixed selections and report typed unsupported-style reasons per target.

### Bug Fixes

- Preserve the sample when switching an active painter between one-shot and sticky modes.
- Keep one-shot mode active after an unsuccessful application.

## 1.0.0 (2026-07-14)

### Features

- Add a headless ProseKit format painter extension with one-shot and sticky modes.
- Support configurable marks, textblocks, wrappers, cursor state, and unsupported-style reporting.

### Bug Fixes

- Preserve existing marks when `marks.apply` is `merge` at a collapsed selection.
- Keep format painter state inactive when its sample is cleared.
