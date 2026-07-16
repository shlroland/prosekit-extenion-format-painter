# Changelog

## [2.0.0](https://github.com/shlroland/prosekit-extenion-format-painter/compare/v1.0.0...v2.0.0) (2026-07-16)


### ⚠ BREAKING CHANGES

* refine format painter semantics

### Features

* refine format painter semantics ([dabd419](https://github.com/shlroland/prosekit-extenion-format-painter/commit/dabd4190d400eb243478869fb72028d5c3407262))


### Bug Fixes

* retain wrappers when sampling fails ([8181434](https://github.com/shlroland/prosekit-extenion-format-painter/commit/8181434f0c42997cc0f8a37f6d41d5dd06132e5f))

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
