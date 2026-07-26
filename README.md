<div align="center">

# ⚽ QDB Converter

**Secure, deterministic FIFA 11–23 database conversion from text folders and PC t3db sources.**

[![Release](https://github.com/Celtian/qdb-converter/actions/workflows/main.yml/badge.svg)](https://github.com/Celtian/qdb-converter/actions/workflows/main.yml)
[![Pull request](https://github.com/Celtian/qdb-converter/actions/workflows/pull-request.yml/badge.svg)](https://github.com/Celtian/qdb-converter/actions/workflows/pull-request.yml)

[Releases](https://github.com/Celtian/qdb-converter/releases) · [Changelog](CHANGELOG.md) · [Source](https://github.com/Celtian/qdb-converter)

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
- 🧮 Preserve stored overall ratings, report target-formula differences, and keep source contract
  and loan dates when they remain valid for the target schema.
- 📤 Export a converted dataset on demand into a unique external text folder without overwriting
  earlier exports.
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
- `tools` — Node-side test configuration and supporting development tooling.

The Angular renderer never receives direct filesystem access. Electron main-process handlers
validate requests and run imports, validation, and conversions in worker threads. Imported and
converted catalogs use separate managed snapshots under Electron's `userData` directory; source
files and external exports are never removed by catalog actions.

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
bun run package:desktop
```

`bun run test` covers the Angular renderer, Electron main-process code, and shared logic. Pull
requests also build the application and verify the packaged Windows executable and ASAR layout.

## 📦 Distribution

```sh
bun run package:desktop
```

This packages Electron for the current host. Stable `vMAJOR.MINOR.PATCH` tags from `master` run the
validation suite, build Windows x64 Squirrel and ZIP artifacts, publish them to GitHub Releases, and
attach SHA-256 checksums. Prerelease versions are published as prereleases.

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
a sandboxed renderer; the preload bridge exposes only typed dataset and conversion operations.
Main-process handlers validate IPC input, constrain source and output paths, and isolate lengthy
imports, validations, and conversions in worker threads.

Managed snapshot deletion affects only application-owned copies. Original import sources and
external conversion output remain untouched.

Report suspected vulnerabilities privately according to [SECURITY.md](SECURITY.md).

## 📄 License

Copyright &copy; 2026 [Dominik Hladík](https://github.com/Celtian).

Licensed under the [MIT License](LICENSE.md).

QDB Converter is not affiliated with or endorsed by Electronic Arts.
