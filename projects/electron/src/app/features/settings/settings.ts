import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { Theme, type ThemePreference } from '../../core/theme';

@Component({
  selector: 'app-settings',
  imports: [MatCardModule, MatIconModule, MatRadioModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  protected readonly theme = inject(Theme);

  protected setTheme(preference: ThemePreference): void {
    this.theme.set(preference);
  }
}
