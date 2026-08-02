import type { DocumentationPage } from './documentation';

const repository = 'https://github.com/Celtian/qdb-converter';

export const additionalDocumentationPages: readonly DocumentationPage[] = [
  {
    path: 'validation-and-export',
    slug: 'validation-and-export',
    title: 'Validation and export',
    label: 'Validation & export',
    icon: 'fact_check',
    content: {
      eyebrow: 'Dataset tools',
      title: 'Check managed data and create a portable text folder',
      summary:
        'Validation is read-only and works with either library. Export is available for converted datasets and always creates a new external folder.',
      actions: [
        { label: 'Manage datasets', route: '/managing-datasets', primary: true },
        { label: 'Conversion guide', route: '/converting' },
      ],
      sections: [
        {
          eyebrow: 'Validate',
          title: 'Choose the managed dataset type',
          paragraphs: [
            'Select Imported dataset or Converted dataset, find the snapshot by name, and run validation. The report summarizes errors and warnings and groups issues by table and field where possible.',
          ],
          items: [
            'Imported snapshots are checked against their detected FIFA edition.',
            'Converted snapshots are checked against their target FIFA edition.',
            'Validation does not modify or repair the snapshot.',
            'Run the report again after replacing or recreating problematic data.',
          ],
        },
        {
          eyebrow: 'Export',
          title: 'Select a converted dataset and destination',
          paragraphs: [
            'Choose an available converted dataset and a parent destination folder. QDB Converter creates a uniquely named child folder, writes the complete snapshot, and offers Reveal in folder when the export succeeds.',
          ],
          steps: [
            'Select the converted dataset.',
            'Choose the parent output folder.',
            'Review the destination summary.',
            'Export and reveal the resulting child folder.',
          ],
        },
        {
          eyebrow: 'Text contract',
          title: 'Write deterministic DB Master text',
          paragraphs: [
            'Each table uses target-schema field order, a UTF-16LE byte-order mark, tab separators, CRLF line endings, and DB Master-compatible quoting. Repeated exports create new folders rather than overwriting earlier output.',
          ],
        },
        {
          eyebrow: 'Safety',
          title: 'Keep managed and external files independent',
          paragraphs: [
            'Deleting a converted dataset later removes only its application-owned managed copy. Previously exported folders remain where you created them.',
          ],
          note: 'Export requires a converted dataset; use the Convert workflow before exporting an imported source.',
        },
      ],
    },
  },
  {
    path: 'settings',
    slug: 'settings',
    title: 'Settings',
    label: 'Settings',
    icon: 'settings',
    content: {
      eyebrow: 'Preferences and storage',
      title: 'Control appearance, table layouts, and managed copies',
      summary:
        'Settings stores local desktop preferences and provides explicit cleanup controls for application-owned datasets.',
      sections: [
        {
          eyebrow: 'Theme',
          title: 'Follow the desktop or choose an appearance',
          paragraphs: [
            'System follows the current operating-system appearance. Light and Dark keep the selected application theme until you change it again.',
          ],
        },
        {
          eyebrow: 'Columns',
          title: 'Configure both dataset table layouts',
          paragraphs: [
            'The Dataset column layouts card contains Imported and Converted tabs. Each tab edits the default visibility and order for its library while keeping required Name and Actions columns available.',
          ],
          items: [
            'Toggle optional columns.',
            'Move columns with pointer, touch, or keyboard controls.',
            'Save changes immediately.',
            'Reset only the active library to its default layout.',
          ],
        },
        {
          eyebrow: 'Storage',
          title: 'Delete selected managed libraries',
          paragraphs: [
            'Choose Imported datasets, Converted datasets, or both. The action is disabled when nothing is selected or the selected library is empty, and confirmation reports the number and category of managed copies that will be removed.',
          ],
          note: 'Cleanup never deletes original source files or folders, and it never deletes previously exported folders.',
        },
      ],
    },
  },
  {
    path: 'development',
    slug: 'development',
    title: 'Development',
    label: 'Development',
    icon: 'code',
    content: {
      eyebrow: 'Contributor guide',
      title: 'Develop the desktop app and documentation together',
      summary:
        'The repository uses Bun, Angular 22, Electron, strict TypeScript, Vitest, Angular Material, and Electron Forge.',
      actions: [
        { label: 'Browse the source', href: repository, primary: true },
        { label: 'Read CONTRIBUTING.md', href: `${repository}/blob/master/CONTRIBUTING.md` },
      ],
      facts: [
        { label: 'Bun', value: '1.3.14' },
        { label: 'Node.js', value: '24.18.x' },
        { label: 'Angular', value: '22' },
        { label: 'Electron', value: '43' },
      ],
      sections: [
        {
          eyebrow: 'Setup',
          title: 'Install and run',
          paragraphs: [
            'Install the pinned dependencies, start the Electron development application, or serve the documentation separately.',
          ],
          code: 'bun install --frozen-lockfile\nbun run start\n\n# Documentation only\nbun run start:docs',
        },
        {
          eyebrow: 'Workspace',
          title: 'Know the project boundaries',
          paragraphs: [
            'projects/electron/src contains the standalone Angular renderer. projects/electron/electron contains Electron main-process, preload, workers, storage, validation, and conversion code. projects/electron/shared contains serializable contracts. projects/docs contains the prerendered documentation site.',
          ],
        },
        {
          eyebrow: 'Quality gates',
          title: 'Run the same checks as CI',
          paragraphs: [
            'The validation suite checks formatting, Angular and Node lint rules, strict type safety, Electron and docs unit tests, accessibility expectations, and coverage thresholds.',
          ],
          code: 'bun run validate\nbun run build\n\n# Individual checks\nbun run format:check\nbun run lint\nbun run typecheck\nbun run test:coverage',
        },
        {
          eyebrow: 'Packaging',
          title: 'Build a local desktop package',
          paragraphs: [
            'Desktop packaging builds the Electron renderer and main process, then asks Electron Forge to package the current host. Documentation is built by the aggregate build and release validation jobs, not bundled into the desktop ASAR.',
          ],
          code: 'bun run package:desktop',
        },
      ],
    },
  },
  {
    path: 'releases',
    slug: 'releases',
    title: 'Releases',
    label: 'Releases',
    icon: 'new_releases',
    content: {
      eyebrow: 'Delivery',
      title: 'Stable Windows releases and versioned documentation',
      summary:
        'A stable version tag validates both Angular applications and Electron, publishes Windows artifacts with checksums, then updates GitHub Pages.',
      actions: [
        { label: 'Latest release', href: `${repository}/releases/latest`, primary: true },
        { label: 'Release history', href: `${repository}/releases` },
        { label: 'Changelog', href: `${repository}/blob/master/CHANGELOG.md` },
      ],
      sections: [
        {
          eyebrow: 'Trigger',
          title: 'Publish from a stable semantic-version tag',
          paragraphs: [
            'Tags matching vMAJOR.MINOR.PATCH must point to the current master commit and match package.json. The release workflow stops before publishing when either check fails.',
          ],
        },
        {
          eyebrow: 'Validation',
          title: 'Build once before publishing',
          paragraphs: [
            'Ubuntu installs pinned dependencies, validates source and tests, builds the Electron renderer, documentation, and Electron main process, verifies the output layout, and uploads documentation plus generated version metadata for downstream jobs.',
          ],
        },
        {
          eyebrow: 'Windows',
          title: 'Publish installer and portable assets',
          paragraphs: [
            'The Windows job creates Squirrel Setup, update metadata, NuGet package, and portable ZIP assets. Every published file receives its own lowercase SHA-256 sidecar, and GitHub-generated release notes include unsigned-application guidance.',
          ],
        },
        {
          eyebrow: 'Documentation',
          title: 'Deploy only after the Windows release succeeds',
          paragraphs: [
            'The prerendered site is published to the gh-pages branch under /qdb-converter/. A copy of index.html is stored as 404.html so direct navigation and refreshes can return to Angular routing.',
          ],
        },
      ],
    },
  },
] as const;
