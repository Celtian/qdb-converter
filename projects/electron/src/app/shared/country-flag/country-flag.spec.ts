import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { CountryFlag } from './country-flag';

describe('CountryFlag', () => {
  let fixture: ComponentFixture<CountryFlag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CountryFlag] }).compileComponents();
    fixture = TestBed.createComponent(CountryFlag);
    fixture.componentRef.setInput('code', 'CZ');
    await fixture.whenStable();
  });

  it('normalizes country codes and renders responsive flag sources', () => {
    const element = fixture.nativeElement as HTMLElement;
    const source = element.querySelector('source');
    const image = element.querySelector('img');

    expect(source?.getAttribute('srcset')).toBe(
      'flags/20x15/cz.png 1x, flags/40x30/cz.png 2x, flags/60x45/cz.png 3x',
    );
    expect(image?.getAttribute('src')).toBe('flags/20x15/cz.png');
    expect(image?.getAttribute('width')).toBe('20');
    expect(image?.getAttribute('height')).toBe('15');
    expect(image?.getAttribute('alt')).toBe('CZ');
  });

  it('uses the supplied accessible country name', async () => {
    fixture.componentRef.setInput('countryName', 'Czechia');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('img')?.getAttribute('alt')).toBe(
      'Czechia',
    );
  });

  it('is hidden from assistive technology in decorative mode', async () => {
    fixture.componentRef.setInput('decorative', true);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('picture')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelector('img')?.getAttribute('alt')).toBe('');
  });
});
