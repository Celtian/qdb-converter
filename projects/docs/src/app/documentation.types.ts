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
