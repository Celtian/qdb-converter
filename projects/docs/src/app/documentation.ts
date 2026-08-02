import { additionalDocumentationPages } from './documentation.additional';

export interface DocumentationAction {
  label: string;
  href?: string;
  route?: string;
  primary?: boolean;
}

export interface DocumentationFact {
  label: string;
  value: string;
}

export interface DocumentationTable {
  caption: string;
  columns: string[];
  rows: string[][];
}

export interface DocumentationSection {
  eyebrow?: string;
  title: string;
  paragraphs: string[];
  items?: string[];
  steps?: string[];
  table?: DocumentationTable;
  code?: string;
  note?: string;
  actions?: DocumentationAction[];
  wide?: boolean;
}

export interface DocumentationContent {
  eyebrow: string;
  title: string;
  summary: string;
  actions?: DocumentationAction[];
  facts?: DocumentationFact[];
  sections: DocumentationSection[];
}

export interface DocumentationPage {
  path: string;
  slug: string;
  title: string;
  label: string;
  icon: string;
  content: DocumentationContent;
}

const repository = 'https://github.com/Celtian/qdb-converter';

export const documentationPages: readonly DocumentationPage[] = [
  {
    path: '',
    slug: 'overview',
    title: 'Documentation',
    label: 'Overview',
    icon: 'home',
    content: {
      eyebrow: 'Local-first desktop app',
      title: 'Convert FIFA databases with a reviewable workflow',
      summary:
        'Import DB Master text folders or paired PC t3db sources, validate managed snapshots, convert compatible tables between FIFA 11–23, and export deterministic text datasets.',
      actions: [
        { label: 'Download for Windows', route: '/download', primary: true },
        { label: 'Start with importing', route: '/importing' },
      ],
      facts: [
        { label: 'Supported games', value: 'FIFA 11–23' },
        { label: 'Platform', value: 'Windows x64' },
        { label: 'Input formats', value: 'Text folder or t3db + XML' },
        { label: 'Output format', value: 'DB Master text folder' },
      ],
      sections: [
        {
          eyebrow: '01 · Import',
          title: 'Make a managed source snapshot',
          paragraphs: [
            'Choose one or more DB Master-compatible text folders, or pair a PC format-8 t3db database with its matching metadata XML. QDB Converter inspects the schema and identifies compatible FIFA editions before any managed copy is created.',
            'Every selected source must pass structural and data validation. Imported snapshots live in application-owned storage; the source folder, database, and XML remain untouched.',
          ],
          actions: [{ label: 'Read the import guide', route: '/importing' }],
        },
        {
          eyebrow: '02 · Manage',
          title: 'Keep source and converted datasets separate',
          paragraphs: [
            'Browse, search, filter, sort, inspect, rename, validate, and remove imported and converted datasets from their separate libraries. Saved column visibility and ordering keep both tables focused on the information you use.',
          ],
          actions: [{ label: 'Manage datasets', route: '/managing-datasets' }],
        },
        {
          eyebrow: '03 · Convert',
          title: 'Build against the target schema',
          paragraphs: [
            'Select an imported dataset and a FIFA 11–23 target. The conversion engine includes every source table supported by the target, orders fields by the target schema, substitutes target defaults for unusable values, and creates an independent managed result.',
          ],
          actions: [{ label: 'Understand conversion', route: '/converting' }],
        },
        {
          eyebrow: '04 · Validate and export',
          title: 'Check the snapshot, then take it outside',
          paragraphs: [
            'Run validation on either library at any time. Export a converted dataset to a unique child folder containing deterministic UTF-16LE, tab-separated, CRLF text files without overwriting an earlier export.',
          ],
          actions: [{ label: 'Validation and export guide', route: '/validation-and-export' }],
        },
        {
          eyebrow: 'Security',
          title: 'Filesystem access stays in Electron',
          paragraphs: [
            'The Angular renderer has no Node.js or direct filesystem access. A typed preload bridge exposes only dataset operations, while Electron validates requests and runs inspection, import, validation, and conversion work outside the renderer.',
          ],
          wide: true,
        },
      ],
    },
  },
  {
    path: 'features',
    slug: 'features',
    title: 'Features',
    label: 'Features',
    icon: 'featured_play_list',
    content: {
      eyebrow: 'Capabilities',
      title: 'A focused pipeline from source data to portable output',
      summary:
        'QDB Converter keeps inspection, managed storage, conversion, validation, and export explicit so each result can be reviewed before it leaves the application.',
      actions: [
        { label: 'Download the app', route: '/download', primary: true },
        { label: 'Import a dataset', route: '/importing' },
      ],
      sections: [
        {
          eyebrow: 'Sources',
          title: 'Inspect two database formats',
          paragraphs: [
            'Import DB Master-compatible text folders or a PC format-8 t3db database paired with metadata XML. The source chooser remembers the last format, supports multiple text sources in one queue, and shows detected tables, rows, FIFA compatibility, paths, and warnings.',
          ],
          items: [
            'UTF-16LE DB Master text tables',
            'Paired .db and .xml PC t3db sources',
            'FIFA 11–23 compatibility detection',
            'Validation before import',
          ],
        },
        {
          eyebrow: 'Libraries',
          title: 'Manage application-owned copies',
          paragraphs: [
            'Imported and converted datasets have separate catalogs and details. Search and filters run against the current library, columns can be shown, hidden, and reordered, and destructive actions identify exactly which managed copies will be removed.',
          ],
          items: [
            'Independent names and status badges',
            'Search, filters, sorting, and pagination',
            'Persistent table column layouts',
            'Single and bulk deletion with confirmation',
          ],
        },
        {
          eyebrow: 'Conversion',
          title: 'Produce target-shaped tables',
          paragraphs: [
            'Conversion is deterministic for the same managed source and target edition. It keeps compatible tables and rows, writes target field order and defaults, and records table-level counts for substituted values and rating differences.',
          ],
          items: [
            'Every target-compatible fifatables table',
            'Target numeric ranges and defaults',
            'Preserved stored overall ratings',
            'Source contract and loan dates retained when valid',
          ],
        },
        {
          eyebrow: 'Output',
          title: 'Validate and export on demand',
          paragraphs: [
            'Validate imported or converted snapshots without changing them. Exported folders are created outside managed storage with collision-safe names and can be revealed directly in the operating-system file manager.',
          ],
        },
        {
          eyebrow: 'Preferences',
          title: 'Fit the desktop',
          paragraphs: [
            'Follow the system appearance or choose a persistent light or dark theme. Configure imported and converted table layouts from one tabbed Settings card, and clear one or both managed libraries without affecting original sources or existing exports.',
          ],
        },
      ],
    },
  },
  {
    path: 'download',
    slug: 'download',
    title: 'Download and installation',
    label: 'Download & installation',
    icon: 'download',
    content: {
      eyebrow: 'Windows x64',
      title: 'Install QDB Converter or run it from a ZIP',
      summary:
        'Use the installer for the normal Windows setup or extract the portable ZIP. Official builds are published only through this project’s GitHub Releases.',
      actions: [
        {
          label: 'Open the latest release',
          href: `${repository}/releases/latest`,
          primary: true,
        },
        { label: 'View all releases', href: `${repository}/releases` },
      ],
      facts: [
        { label: 'Recommended', value: 'QDB-Converter-Setup.exe' },
        { label: 'Alternative', value: 'Windows x64 ZIP' },
        { label: 'Updates', value: 'GitHub Releases' },
        { label: 'License', value: 'MIT' },
      ],
      sections: [
        {
          eyebrow: 'Recommended',
          title: 'Install with Setup',
          paragraphs: [
            'Download QDB-Converter-Setup.exe from the latest release and run it. The installed application checks GitHub Releases for compatible updates when it starts.',
          ],
          steps: [
            'Open the official latest release.',
            'Download QDB-Converter-Setup.exe and its .sha256 sidecar.',
            'Verify the checksum when you need additional assurance.',
            'Run the installer and launch QDB Converter.',
          ],
        },
        {
          eyebrow: 'Portable',
          title: 'Run from the ZIP',
          paragraphs: [
            'Download the Windows x64 ZIP, extract the complete archive to a writable folder, and run QDB Converter.exe. Do not run the executable from inside the compressed archive.',
          ],
        },
        {
          eyebrow: 'Windows security',
          title: 'Review unsigned-app warnings carefully',
          paragraphs: [
            'Current releases are unsigned, so Windows SmartScreen or antivirus software may display a warning. Confirm that the asset came from the Celtian/qdb-converter release page and compare the supplied SHA-256 sidecar before deciding whether to continue.',
          ],
          note: 'Do not disable antivirus globally to run the application.',
        },
        {
          eyebrow: 'First run',
          title: 'Create your first managed dataset',
          paragraphs: [
            'Open Import, select a source format, inspect the source, choose a compatible FIFA edition, validate it, and confirm the managed name. The original source remains unchanged.',
          ],
          actions: [{ label: 'Continue to importing', route: '/importing' }],
        },
      ],
    },
  },
  {
    path: 'importing',
    slug: 'importing',
    title: 'Importing',
    label: 'Importing',
    icon: 'upload_file',
    content: {
      eyebrow: 'Source datasets',
      title: 'Inspect and validate before creating a managed copy',
      summary:
        'The import wizard separates source selection, FIFA edition choice, validation, and the final import so an incompatible or damaged source cannot silently enter the library.',
      actions: [
        { label: 'Manage imported datasets', route: '/managing-datasets', primary: true },
        { label: 'Conversion guide', route: '/converting' },
      ],
      sections: [
        {
          eyebrow: 'Step 1',
          title: 'Choose the source format',
          paragraphs: [
            'Text folder accepts one or more folders containing DB Master-compatible table files. PC t3db accepts exactly one .db file and its matching metadata .xml file. Changing formats clears the current selection to avoid mixing incompatible inputs.',
          ],
          table: {
            caption: 'Supported import formats',
            columns: ['Format', 'Files', 'Important requirement'],
            rows: [
              [
                'Text folder',
                'One folder per dataset',
                'UTF-16LE table files with DB Master layout',
              ],
              ['PC t3db', 'One .db plus one .xml', 'PC format version 8 with matching metadata'],
            ],
          },
        },
        {
          eyebrow: 'Step 2',
          title: 'Review detected source information',
          paragraphs: [
            'Inspection reports the display name, source paths, source kind, table and row totals, compatible FIFA editions, and warnings. Rename a queued text source before import when the detected folder name is not useful.',
          ],
          note: 'Inspection does not modify the selected files or folders.',
        },
        {
          eyebrow: 'Step 3',
          title: 'Choose an edition and validate',
          paragraphs: [
            'Select one compatible FIFA edition for each source, then run validation. Validation checks table structure, field values, identifiers, numeric ranges, and known relationships against that edition. Sources with errors cannot be imported.',
          ],
          items: [
            'Warnings explain suspicious data that does not block import.',
            'Errors identify data that must be corrected at the source.',
            'Changing the chosen edition invalidates the previous validation.',
            'Long-running validation and import operations can be cancelled.',
          ],
        },
        {
          eyebrow: 'Step 4',
          title: 'Create the managed snapshot',
          paragraphs: [
            'Review the validated sources and names, then import them. QDB Converter creates private application-owned copies and refreshes the Imported datasets library.',
          ],
          note: 'Removing an imported snapshot later deletes only the managed copy. Original source files are never removed.',
        },
      ],
    },
  },
  {
    path: 'managing-datasets',
    slug: 'managing-datasets',
    title: 'Managing datasets',
    label: 'Managing datasets',
    icon: 'storage',
    content: {
      eyebrow: 'Dataset libraries',
      title: 'Search, inspect, and maintain managed snapshots',
      summary:
        'Imported datasets are conversion sources. Converted datasets are independent results. Each library has its own filters, columns, details, names, validation actions, and deletion boundaries.',
      actions: [
        { label: 'Convert a dataset', route: '/converting', primary: true },
        { label: 'Settings guide', route: '/settings' },
      ],
      sections: [
        {
          eyebrow: 'Find',
          title: 'Search, filter, sort, and page',
          paragraphs: [
            'Search dataset names, open Filters to stage library-specific criteria, sort supported columns, and page through the results. Apply runs the staged filter set; Cancel discards draft changes; Clear all removes draft filters.',
          ],
          items: [
            'Imported filters cover source kind, FIFA version, status, table count, and row count.',
            'Converted filters cover source and target editions, status, table count, and row count.',
            'Applied filters remain local to the desktop application.',
          ],
        },
        {
          eyebrow: 'Columns',
          title: 'Choose the visible table layout',
          paragraphs: [
            'Open Columns to show, hide, and reorder optional fields. Drag a handle or use the keyboard controls, then Apply to save visibility and order. Reset to defaults restores the application layout.',
            'Settings exposes the same preferences in one Dataset column layouts card with Imported and Converted tabs.',
          ],
        },
        {
          eyebrow: 'Details',
          title: 'Inspect provenance and conversion summaries',
          paragraphs: [
            'Imported details show the source format, original paths, detected FIFA edition, integrity status, size, table and row totals, and import time. Converted details add the source dataset, source and target editions, conversion time, and per-table conversion summary.',
          ],
        },
        {
          eyebrow: 'Names',
          title: 'Rename without changing the snapshot',
          paragraphs: [
            'Rename a managed dataset from its details action. Names are kept unique within the relevant library and do not rename source files or existing exported folders.',
          ],
        },
        {
          eyebrow: 'Deletion',
          title: 'Remove only application-owned copies',
          paragraphs: [
            'Delete one dataset from its details view, select multiple rows for bulk deletion, or use Settings to clear imported datasets, converted datasets, or both. Confirmation describes the affected managed records.',
          ],
          note: 'Deleting imported data does not automatically delete converted results, and no catalog action deletes original sources or external exports.',
          wide: true,
        },
      ],
    },
  },
  {
    path: 'converting',
    slug: 'converting',
    title: 'Converting',
    label: 'Converting',
    icon: 'transform',
    content: {
      eyebrow: 'FIFA 11–23',
      title: 'Create an independent dataset for the target edition',
      summary:
        'Conversion reads one validated managed source, applies the target fifatables schema, and saves a new managed text dataset without changing the import.',
      actions: [
        { label: 'Validation and export', route: '/validation-and-export', primary: true },
        { label: 'Review features', route: '/features' },
      ],
      sections: [
        {
          eyebrow: 'Step 1',
          title: 'Select a source and target',
          paragraphs: [
            'Choose an available imported dataset and a target from FIFA 11 through FIFA 23. Give the result a unique name in the Converted datasets library.',
          ],
          note: 'A source with no tables supported by the target edition cannot produce a conversion.',
        },
        {
          eyebrow: 'Schema',
          title: 'Map every compatible table',
          paragraphs: [
            'For each supported source table, QDB Converter writes the target schema’s field order. Missing, empty, non-numeric, out-of-range, or invalid date values use the target field default. Unsupported source fields and tables do not enter the result.',
          ],
          items: [
            'String and numeric values are normalized for the target field type.',
            'Target minimums, maximums, defaults, and date encoding are enforced.',
            'Contract and loan dates remain unchanged when they are valid for the target.',
            'The same source snapshot and target produce deterministic table content.',
          ],
        },
        {
          eyebrow: 'Player ratings',
          title: 'Preserve stored overall ratings',
          paragraphs: [
            'Player overall ratings are copied rather than recalculated. When the stored value differs from the target edition’s rating formula, the conversion summary reports the difference so it can be reviewed without silently changing the source decision.',
          ],
        },
        {
          eyebrow: 'Result',
          title: 'Review table-level conversion counts',
          paragraphs: [
            'The completed result records table and row totals plus counts for substituted values and player rating differences. It becomes an independent managed dataset that can be renamed, validated, deleted, or exported.',
          ],
        },
      ],
    },
  },
  ...additionalDocumentationPages,
] as const;
