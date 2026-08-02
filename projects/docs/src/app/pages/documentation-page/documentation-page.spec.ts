import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import axe from 'axe-core';

import type { DocumentationContent } from '../../documentation';
import { DocumentationPage } from './documentation-page';

describe('DocumentationPage', () => {
  const content = {
    eyebrow: 'User guide',
    title: 'Test documentation',
    summary: 'A representative documentation page.',
    actions: [
      { label: 'Internal action', route: '/internal', primary: true },
      { label: 'External action', href: 'https://example.com/external' },
    ],
    facts: [{ label: 'Platform', value: 'Windows x64' }],
    sections: [
      {
        eyebrow: 'Workflow',
        title: 'Structured content',
        paragraphs: ['A paragraph.'],
        items: ['A feature'],
        steps: ['First step'],
        table: {
          caption: 'Supported formats',
          columns: ['Format', 'Requirement'],
          rows: [
            ['Text folder', 'UTF-16LE'],
            ['PC t3db', 'Database and XML'],
          ],
        },
        code: 'bun run validate',
        note: 'Keep the original source.',
        actions: [
          { label: 'Related guide', route: '/internal' },
          { label: 'Project source', href: 'https://example.com/source' },
        ],
        wide: true,
      },
    ],
  } satisfies DocumentationContent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentationPage],
      providers: [
        provideRouter([{ path: 'internal', component: DocumentationPage }]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { content } } },
        },
      ],
    }).compileComponents();
  });

  it('renders facts, lists, steps, tables, code, notes, and actions semantically', async () => {
    const fixture = TestBed.createComponent(DocumentationPage);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Test documentation');
    expect(page.querySelector('.facts dd')?.textContent).toContain('Windows x64');
    expect(page.querySelectorAll('ul li')).toHaveLength(1);
    expect(page.querySelectorAll('ol li')).toHaveLength(1);
    expect(page.querySelector('.table-scroll')?.getAttribute('role')).toBe('region');
    expect(page.querySelector('.table-scroll')?.getAttribute('tabindex')).toBe('0');
    expect(page.querySelector('caption')?.textContent).toContain('Supported formats');
    expect([...page.querySelectorAll('th')].map((cell) => cell.textContent.trim())).toEqual([
      'Format',
      'Requirement',
    ]);
    expect(page.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(page.querySelector('pre code')?.textContent).toContain('bun run validate');
    expect(page.querySelector('aside')?.textContent).toContain('Keep the original source');
    expect(page.querySelector('.documentation-card.wide')).not.toBeNull();
  });

  it('marks external links as new-tab actions and keeps router actions internal', async () => {
    const fixture = TestBed.createComponent(DocumentationPage);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const externalLinks = [...page.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')];
    const internalLinks = [...page.querySelectorAll<HTMLAnchorElement>('a[href="/internal"]')];

    expect(externalLinks).toHaveLength(2);
    for (const link of externalLinks) {
      expect(link.rel).toBe('noopener noreferrer');
      expect(link.getAttribute('aria-label')).toContain('opens in a new tab');
      expect(link.querySelector('mat-icon')?.textContent).toContain('open_in_new');
    }
    expect(internalLinks).toHaveLength(2);
  });

  it('has no detectable AXE accessibility violations', async () => {
    const fixture = TestBed.createComponent(DocumentationPage);
    await fixture.whenStable();

    const results = await axe.run(fixture.nativeElement as HTMLElement);
    expect(results.violations).toEqual([]);
  });
});
