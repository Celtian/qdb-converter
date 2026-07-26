import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Settings } from './settings';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Settings],
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('changes the application theme', () => {
    const settings = component as unknown as { setTheme(value: 'dark'): void };
    settings.setTheme('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });
});
