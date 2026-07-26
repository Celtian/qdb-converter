import { ComponentFixture, TestBed } from '@angular/core/testing';

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
});
