import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { AppNavigation } from './app-navigation';

describe('AppNavigation', () => {
  let component: AppNavigation;
  let fixture: ComponentFixture<AppNavigation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppNavigation],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppNavigation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens application information', () => {
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open');
    (component as unknown as { openAbout(): void }).openAbout();
    expect(open).toHaveBeenCalled();
  });

  it('exposes Material navigation actions through component harnesses', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const actions = await loader.getAllHarnesses(MatButtonHarness);
    expect(actions.length).toBeGreaterThanOrEqual(5);
  });
});
