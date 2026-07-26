import { ComponentFixture, TestBed } from '@angular/core/testing';
import axe from 'axe-core';

import { VERSION_INFO } from '../../../../../version-info';
import { AboutDialog } from './about-dialog';

describe('AboutDialog', () => {
  let component: AboutDialog;
  let fixture: ComponentFixture<AboutDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the generated application version', () => {
    const content = fixture.nativeElement as HTMLElement;

    expect(content.querySelector('.version')?.textContent).toContain(
      `Version ${VERSION_INFO.version}`,
    );
  });

  it('renders the product description and legal information', () => {
    const content = fixture.nativeElement as HTMLElement;

    expect(content.querySelector('.description')?.textContent).toContain(
      'Local-first Windows desktop application for importing and converting FIFA 11–23 database datasets',
    );
    expect(content.querySelector('.legal')?.textContent).toContain(
      '© 2026 Dominik Hladík · MIT License',
    );
  });

  it('links to the documentation and GitHub repository safely', () => {
    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
        '.external-actions a',
      ),
    );

    expect(
      links.map((link) => ({
        label: link.textContent?.trim(),
        href: link.getAttribute('href'),
        target: link.target,
        rel: link.rel,
      })),
    ).toEqual([
      {
        label: 'menu_bookDocumentation',
        href: 'https://github.com/Celtian/qdb-converter#readme',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      {
        label: 'codeGitHub',
        href: 'https://github.com/Celtian/qdb-converter',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    ]);
  });

  it('provides icon and text controls for closing the dialog', () => {
    const content = fixture.nativeElement as HTMLElement;
    const closeButtons = Array.from(
      content.querySelectorAll<HTMLButtonElement>('button[mat-dialog-close]'),
    );

    expect(closeButtons).toHaveLength(2);
    expect(closeButtons[0]?.getAttribute('aria-label')).toBe('Close About dialog');
    expect(closeButtons[1]?.textContent?.trim()).toBe('Close');
  });

  it('has no automatically detectable accessibility violations', async () => {
    const result = await axe.run(fixture.nativeElement as HTMLElement);
    expect(result.violations).toEqual([]);
  });
});
