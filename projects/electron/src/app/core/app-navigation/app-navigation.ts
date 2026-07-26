import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AboutDialog } from '../about-dialog/about-dialog';

interface NavigationLink {
  path: string;
  icon: string;
  label: string;
  exact?: boolean;
}

@Component({
  selector: 'app-app-navigation',
  imports: [MatButtonModule, MatDividerModule, MatIconModule, RouterLink, RouterLinkActive],
  templateUrl: './app-navigation.html',
  styleUrl: './app-navigation.css',
})
export class AppNavigation {
  private readonly dialog = inject(MatDialog);

  protected readonly links: readonly NavigationLink[] = [
    { path: '/', icon: 'storage', label: 'Datasets', exact: true },
    { path: '/convert', icon: 'transform', label: 'Convert' },
    { path: '/conversions', icon: 'history', label: 'Conversions' },
  ];

  protected openAbout(): void {
    this.dialog.open(AboutDialog, {
      width: '440px',
      maxWidth: 'calc(100vw - 2rem)',
      autoFocus: 'dialog',
    });
  }
}
