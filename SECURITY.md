# Security Policy

## Supported Versions

Security fixes are applied to the latest release and the current `master` branch. Users should
update to the newest published QDB Converter release.

## Reporting a Vulnerability

Do not open a public issue for a suspected vulnerability. Report security concerns privately by
email:

- dominik.hladik@seznam.cz

Include the affected version and operating system, source format, affected component or IPC
operation, reproduction steps, potential impact, sanitized proof-of-concept input, and a suggested
mitigation when possible. Do not send proprietary or sensitive database content.

## Response Expectations

- Initial acknowledgment within five business days.
- Triage and severity assessment after acknowledgment.
- Coordinated disclosure after a fix is available.

## Security Model

The Angular renderer is sandboxed with context isolation enabled and Node integration disabled. A
context-isolated preload exposes narrow typed IPC operations; Electron and filesystem access remain
in the main process. IPC senders and arguments are validated before managed dataset, source, output,
or shell operations are performed. Dataset inspection, validation, import, and conversion run in
worker threads, while managed snapshots remain separate from external conversion output.

Reports describing an IPC boundary bypass, arbitrary filesystem access, unsafe handling of
supported source data, untrusted remote content execution, or deletion or modification of
unmanaged output are particularly important.
