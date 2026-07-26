# Contributing

Thanks for improving QDB Converter.

## Prerequisites

- Bun 1.3.14
- Node.js 24.18 or newer, but earlier than Node.js 25
- WSLg or a native Linux desktop for Linux development
- Windows or the Windows CI runner for supported release artifacts

## Getting Started

```bash
bun install --frozen-lockfile
bun run start
```

Inside WSL, Electron runs as a Linux application through WSLg. Do not configure Xming-specific
`DISPLAY` values. Generated application bundles, coverage, managed datasets, conversion output,
and Electron Forge output must not be committed.

## Workspace Structure

- `projects/electron/src/` contains the standalone Angular renderer.
- `projects/electron/electron/` contains Electron main/preload code and worker-thread operations.
- `projects/electron/shared/` contains serializable IPC contracts and shared utilities.
- `tools/` contains Node-runtime tests and supporting utilities.
- `examples/` contains checked-in FIFA database source data used for local testing.

Use strict, standalone, zoneless Angular with CSS stylesheets. Generate Angular artifacts through
Angular CLI and keep applications under `projects/`.

## Project Commands

- `bun run start` — compile and launch Angular with Electron.
- `bun run build` — build the Angular renderer and Electron processes.
- `bun run test` — run Angular and Node-runtime Vitest suites.
- `bun run test:coverage` — run all test suites with coverage.
- `bun run lint` — lint TypeScript and Angular templates.
- `bun run typecheck` — type-check Angular and Electron code.
- `bun run format:check` — verify Prettier formatting.
- `bun run validate` — run all source checks and tests.
- `bun run package:desktop` — package Electron for the current host.
- `bun run release:windows` — create Windows Squirrel and ZIP artifacts.

## Contribution Process

1. Create a focused branch from `master`.
2. Use Angular Conventional Commits such as `feat(conversion): add an output option`.
3. Add or update tests for changed behavior.
4. Run `bun run validate` and `bun run build`.
5. Explain behavioral, dataset-format, IPC, filesystem, and packaging effects in the pull request.

## Coding, Data, and Accessibility Standards

- Follow `AGENTS.md`.
- Use signals and Signal Forms for new renderer forms and state.
- Keep Electron, dialogs, worker threads, and filesystem APIs outside Angular.
- Expose narrow, serializable operations through the context-isolated preload API.
- Validate source data and IPC arguments before filesystem operations.
- Preserve deterministic DB Master output formatting and target-schema behavior.
- Maintain keyboard operation, visible focus, appropriate ARIA semantics, and WCAG AA contrast.
- Keep AXE checks passing.

## Git Hooks

`bun install` configures Husky. The pre-commit hook formats and lints staged files through
lint-staged, and the commit-message hook enforces Angular Conventional Commits.

## Reporting Issues

Include expected and actual behavior, reproduction steps, QDB Converter version, operating system,
source and target FIFA editions, input format, and sanitized logs. Do not attach proprietary or
sensitive database content. Report security concerns privately according to
[SECURITY.md](SECURITY.md).
