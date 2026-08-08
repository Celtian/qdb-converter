<div align="center">

# ⚽ QDB Converter

**Secure, deterministic FIFA 11–23 database conversion from text folders and PC t3db sources.**

[![Release](https://github.com/Celtian/qdb-converter/actions/workflows/main.yml/badge.svg)](https://github.com/Celtian/qdb-converter/actions/workflows/main.yml)
[![Pull request](https://github.com/Celtian/qdb-converter/actions/workflows/pull-request.yml/badge.svg)](https://github.com/Celtian/qdb-converter/actions/workflows/pull-request.yml)

[Documentation](https://celtian.github.io/qdb-converter/) · [Releases](https://github.com/Celtian/qdb-converter/releases) · [Changelog](CHANGELOG.md) · [Source](https://github.com/Celtian/qdb-converter)

</div>

QDB Converter is a local-first Windows desktop application for importing and independently
converting FIFA 11–23 database datasets. It accepts DB Master-compatible UTF-16LE text folders and
paired PC t3db `.db` + `.xml` sources, keeps managed snapshots, and writes deterministic text-folder
exports.

## ✨ Features

- 📥 Import one or more DB Master text folders or a PC t3db format-8 database with its matching
  metadata XML.
- ✅ Inspect source schemas, detect compatible FIFA editions, and validate tables, values,
  identifiers, ranges, and relationships before conversion.
- 🗃️ Browse, search, filter, sort, rename, validate, and safely remove imported source snapshots.
- 🔄 Convert one imported dataset to FIFA 11–23 as an independent managed dataset containing every
  target-compatible table.
- 🪪 Minimize holes in player-name IDs, remove unused name rows, or apply both in one run using a
  snapshot from either managed library.
- 📊 Open any imported or converted dataset to inspect compact, zoomable per-table ID-run
  overviews with range tooltips and accessible keyboard controls.
- 🧮 Preserve stored overall ratings, report target-formula differences, and keep source contract
  and loan dates when they remain valid for the target schema.
- 📤 Atomically overwrite the selected managed snapshot or save a new Playernames result in the
  Converted library; export converted datasets without overwriting earlier output.
- 🎨 Follow the system theme or choose a persistent light or dark appearance.
- ⬆️ Check GitHub Releases automatically for packaged-application updates.
- 🔒 Keep filesystem access, validation, imports, and conversions behind a narrow typed Electron
  preload bridge.

## 🔄 Supported conversion behavior

- ⚽ FIFA 11 through FIFA 23.
- 📚 All tables exposed by `fifatables`.
- 🧱 Target-schema field order, defaults, and numeric ranges.
- 📝 UTF-16LE BOM, tab separators, CRLF line endings, and DB Master quoting.
- 📅 No automatic expiry extension for contracts and loans.
- 📊 Preserved stored overall ratings with reported target-formula differences.

## 🗂️ Workspace

- `projects/electron/src` — standalone Angular renderer and desktop interface.
- `projects/electron/electron` — Electron main process, preload bridge, workers, dataset library, and
  conversion engine.
- `projects/electron/shared` — serializable IPC contracts and FIFA table configuration.
- `projects/docs` — statically prerendered Angular documentation deployed to GitHub Pages.
- `tools` — Node-side test configuration and supporting development tooling.

The Angular renderer never receives direct filesystem access. Electron main-process handlers
validate requests and run imports, validation, conversions, and Playernames operations in worker
threads. Imported and converted catalogs use separate managed snapshots under Electron's
`userData` directory; source files and external results are never removed by catalog actions.

Brand artwork is maintained and generated in
[`Celtian/app-logos`](https://github.com/Celtian/app-logos) under the `qdb-converter` project. This
repository checks in only the generated logo and favicon it consumes, plus the derived Windows
packaging icon. Update the canonical artwork there before refreshing these assets.

## 🚀 Getting started

Requirements:

- [Bun](https://bun.sh/) 1.3.14.
- Node.js 24.18 or newer, but earlier than Node.js 25.

```sh
bun install --frozen-lockfile
bun run start
```

Angular starts on `127.0.0.1:4200`, Electron main and preload code compile into `.electron`, and
Electron opens the desktop window.

Run the documentation site separately:

```sh
bun run start:docs
```

## 🧪 Checks and builds

Run the complete validation suite:

```sh
bun run validate
```

Or run individual checks and builds:

```sh
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run test:coverage
bun run build
bun run build:docs
bun run package:desktop
```

`bun run test` covers the Angular renderer, documentation, Electron main-process code, and shared
logic. Pull requests build both Angular applications and verify the packaged Windows executable and
ASAR layout.

## 📦 Distribution

```sh
bun run package:desktop
```

This packages Electron for the current host. Stable `vMAJOR.MINOR.PATCH` tags from `master` run the
validation suite, build Windows x64 Squirrel and ZIP artifacts, publish them to GitHub Releases, and
attach a SHA-256 sidecar to every artifact. After the Windows release succeeds, the same workflow
publishes the prerendered documentation to the `gh-pages` branch.

### 🪟 Installing on Windows

Choose one release asset:

1. Download and run `QDB-Converter-Setup.exe` for the normal installation.
2. Or download the Windows x64 ZIP, extract it completely, and run `QDB Converter.exe`.

The application is currently unsigned. Windows SmartScreen or antivirus software may warn about
it. Confirm that the file came from the expected GitHub Release and compare it with the published
SHA-256 checksums before deciding whether to continue. Do not disable antivirus globally.

⬆️ Packaged installations check GitHub Releases for updates automatically.

## 🏷️ Versioning and changelog

Release commands use Bun's version lifecycle:

```sh
bun run release:patch
bun run release:minor
bun run release:major
```

Each command checks out `master`, updates `package.json`, refreshes the generated application
version, regenerates and stages [CHANGELOG.md](CHANGELOG.md), creates the release commit and `v*`
tag, and then pushes the commit and tags. The pushed tag starts the Release workflow.

Run release commands only from a clean working tree. Review the generated changelog before
publishing because the `postversion` lifecycle intentionally pushes to the configured Git remote.
To regenerate the changelog without creating a release, run `bun run changelog`.

## 🔒 Security

The Angular renderer has no Node.js or direct filesystem access. Electron uses context isolation and
a sandboxed renderer; the preload bridge exposes only typed dataset, conversion, and Playernames
operations.
Main-process handlers validate IPC input, constrain source and output paths, and isolate lengthy
imports, validations, conversions, and Playernames operations in worker threads.

Dataset details analyze the current managed snapshot in a worker and show cards only for tables
supported by `fifatables`, with an accessible PixiJS range chart when a canonical ranged row ID is
available. Unsupported text files remain safely preserved and summarized by the import warning,
but do not appear as misleading table cards. Green occupied runs and amber hole runs share a
proportional active span, the full remaining range is represented by a compact gray capacity tail,
and red edge indicators identify occupied values outside the published range.
Drag horizontally to pan, pinch or use Ctrl/Cmd plus the mouse wheel to zoom around the pointer,
and double-click to restore the complete overview. Ordinary vertical wheel input continues to
scroll the details dialog. Pointer and keyboard inspection report each contiguous run’s start, end,
and count; Page Up/Down pan, +/- zoom, and 0 resets the view. Tables without a reliable unique
ranged key explain why a hole profile is unavailable instead of treating repeated foreign keys as
row IDs.

Playernames shows the available `playernames` and `dcplayernames` profiles as separate rows in one
shared-axis canvas before a run and in retained before/after summaries. Matching IDs align across
rows without obscuring each table's state, and headline totals sum both tables. Disjoint published
ranges are shown next to each other without treating the invalid numeric gap as capacity. FIFA
editions such as FIFA 23 that do not define `dcplayernames` show only `playernames`. Minimize can
repair referenced integer IDs outside the published FIFA range when the tables still fit their
available capacity; Remove unused alone requires IDs to already be in range. When strict analysis
finds duplicate or ambiguous references after profiling the tables, the diagnostic canvas remains
available while Playernames operations stay blocked.

Explicit Playernames overwrite replaces only the selected application-owned snapshot and leaves
its original import sources untouched. Managed deletion and external conversion output keep the
same safety boundary.

Report suspected vulnerabilities privately according to [SECURITY.md](SECURITY.md).

## 📄 License

Copyright &copy; 2026 [Dominik Hladík](https://github.com/Celtian).

Licensed under the [MIT License](LICENSE.md).

QDB Converter is not affiliated with or endorsed by Electronic Arts.
