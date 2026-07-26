import { ComponentFixture, TestBed } from '@angular/core/testing';

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
});
