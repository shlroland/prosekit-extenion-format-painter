# Repository Guidelines

## Project Structure & Module Organization

This repository contains a headless ProseKit extension for format painter behavior. Core extension code lives in `src/index.ts`, with exported cursor styling in `src/style.css`. Browser tests live in `test/`, with shared helpers in `test/utils.ts`. The local React/Vite demo is under `website/`. Build and tooling config is kept at the root, including `package.json`, `tsconfig.json`, `vitest.config.ts`, `tsdown.config.ts`, and `eslint.config.js`.

## Architecture Overview

Keep the package headless. `src/index.ts` owns the ProseKit extension, commands, state helpers, and editor-view integration. `src/style.css` should stay limited to cursor/state styling based on `data-format-painter`. The `website/` directory is only a demo surface; do not move reusable extension behavior there.

## Build, Test, and Development Commands

Use pnpm, as declared by `packageManager`.

- `pnpm install`: install dependencies from `pnpm-lock.yaml`.
- `pnpm dev`: start the Vite demo at `http://localhost:5173/`.
- `pnpm test -- --run`: run the Vitest browser test suite once.
- `pnpm test`: run Vitest in watch mode.
- `pnpm lint`: lint the repository with ESLint.
- `pnpm typecheck`: run TypeScript project checks.
- `pnpm build`: build the package with `tsdown` and the demo with Vite.
- `pnpm fix`: apply ESLint fixes and Prettier formatting.

## Coding Style & Naming Conventions

Write TypeScript ESM. Follow the existing style: two-space indentation, single quotes, no semicolons, named exports, and explicit exported interfaces/types for public API shapes. Keep extension helpers framework agnostic in `src/`; React-specific code belongs in `website/`. Use camelCase for functions and variables, PascalCase for exported types/interfaces, and kebab-case for package-level file names where established.

## Testing Guidelines

Tests use Vitest with Playwright Chromium browser mode. Add behavior tests in `test/*.test.ts`, using `it('describes expected behavior', ...)` and inline snapshots where document structure matters. Cover changes to format sampling, mark application modes, wrapper/textblock copying, sticky state, keyboard clearing, and `data-format-painter` DOM state. Prefer public commands/helpers from `src/index.ts` over private implementation details. Update inline snapshots only when the ProseMirror document shape intentionally changes. Run `pnpm test -- --run`, `pnpm typecheck`, and `pnpm lint` before submitting changes.

## Commit & Pull Request Guidelines

Recent history uses short Conventional Commit-style subjects, such as `feat: add format painter extension`. Keep commit subjects imperative and scoped to one change. Pull requests should include a clear description, tests run, linked issues when applicable, and screenshots for visible demo changes. Note API or behavior changes explicitly because this package is published through its `dist` output and `exports` map.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in this repository's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five-label triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Use the single-context layout: root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
