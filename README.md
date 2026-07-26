# QDB Converter

QDB Converter is a Windows desktop application for importing and independently converting FIFA
11–23 database datasets. It accepts DB Master-compatible UTF-16LE text folders and paired t3db
`.db` + `.xml` sources, keeps managed snapshots, and writes deterministic text-folder output.

## Development

Requirements:

- Bun 1.3.14
- Node.js 24.18

```sh
bun install
bun start
```

Useful checks:

```sh
bun run validate
bun run test:coverage
bun run package:desktop
```

The Angular renderer never receives direct filesystem access. Electron main-process handlers
validate requests and run imports and conversions in worker threads. Catalog data and managed
snapshots live under Electron's `userData` directory; external conversion output is never removed
by catalog actions.

## Supported conversion behavior

- FIFA 11 through FIFA 23
- All tables exposed by `fifatables`
- Target schema field order, defaults, and numeric ranges
- UTF-16LE BOM, tab separators, CRLF line endings, and DB Master quoting
- Optional expiry extension for contracts and loans
- Stored overall ratings are preserved; target-formula differences are reported

QDB Converter is not affiliated with or endorsed by Electronic Arts.
