# Changelog

## [3.1.0](https://github.com/shlroland/prosekit-extension-format-painter/compare/v3.0.0...v3.1.0) (2026-07-16)


### Features

* support public prosekit imports ([499a687](https://github.com/shlroland/prosekit-extension-format-painter/commit/499a6872d1aa763b0f0b6bd13dc767db6cd57aab))


### Bug Fixes

* correct repository metadata ([c3fa97c](https://github.com/shlroland/prosekit-extension-format-painter/commit/c3fa97c3ce34c143bd74febd3fe3da0e4f1a23f9))

## [3.0.0](https://github.com/shlroland/prosekit-extenion-format-painter/compare/v2.0.0...v3.0.0) (2026-07-16)


### ⚠ BREAKING CHANGES

* refine format painter semantics

### Features

* add bound format painter controller ([17899f6](https://github.com/shlroland/prosekit-extenion-format-painter/commit/17899f67bd7b6deedb2bc1076012120b7b78b9c2))
* add format painter extension ([7204bde](https://github.com/shlroland/prosekit-extenion-format-painter/commit/7204bde64ca208b8114e34136c3d69423af7fe25))
* prepare format painter 1.0.0 ([9252c00](https://github.com/shlroland/prosekit-extenion-format-painter/commit/9252c0089bce7140d0f514957bc9f08865c51060))
* refine format painter semantics ([dabd419](https://github.com/shlroland/prosekit-extenion-format-painter/commit/dabd4190d400eb243478869fb72028d5c3407262))
* support wrapper format painting ([be53c02](https://github.com/shlroland/prosekit-extenion-format-painter/commit/be53c0231579ad9b1bde3aef71f184c7957a2100))


### Bug Fixes

* retain wrappers when sampling fails ([8181434](https://github.com/shlroland/prosekit-extenion-format-painter/commit/8181434f0c42997cc0f8a37f6d41d5dd06132e5f))

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
