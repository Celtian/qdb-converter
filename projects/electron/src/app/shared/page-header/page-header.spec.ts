import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PageHeader } from './page-header';

@Component({
  imports: [PageHeader],
  template: `
    <app-page-header
      heading="Dataset library"
      description="Manage imported datasets."
      headingId="dataset-library-heading"
    >
      <a href="/datasets">View datasets</a>
    </app-page-header>
  `,
})
class PageHeaderHost {}

describe('PageHeader', () => {
  it('renders its content, typography, and projected action', async () => {
    const fixture = TestBed.createComponent(PageHeaderHost);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const host = element.querySelector('app-page-header');
    const header = host?.querySelector('header');
    const heading = header?.querySelector('h1');
    const description = header?.querySelector('p');
    const action = header?.querySelector('a');

    expect(host?.classList.contains('block')).toBe(true);
    expect(header?.classList.contains('sticky')).toBe(true);
    expect(header?.classList.contains('max-nav:flex-col')).toBe(true);
    expect(heading?.id).toBe('dataset-library-heading');
    expect(heading?.textContent).toBe('Dataset library');
    expect(heading?.classList.contains('text-3xl')).toBe(true);
    expect(heading?.classList.contains('font-bold')).toBe(true);
    expect(description?.textContent).toBe('Manage imported datasets.');
    expect(description?.classList.contains('text-lg')).toBe(true);
    expect(action?.textContent).toBe('View datasets');
  });
});
