import { NgOptimizedImage } from '@angular/common';
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

interface NavigationGroup {
  id: string;
  label: string;
  links: readonly NavigationLink[];
}

@Component({
  selector: 'app-app-navigation',
  imports: [
    NgOptimizedImage,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './app-navigation.html',
  styleUrl: './app-navigation.css',
})
export class AppNavigation {
  private readonly dialog = inject(MatDialog);

  protected readonly linkGroups: readonly NavigationGroup[] = [
    {
      id: 'data',
      label: 'Imports',
      links: [
        { path: '/import', icon: 'upload_file', label: 'Import' },
        { path: '/', icon: 'storage', label: 'Datasets', exact: true },
      ],
    },
    {
      id: 'conversion',
      label: 'Conversion',
      links: [
        { path: '/convert', icon: 'transform', label: 'Convert' },
        { path: '/datasets', icon: 'storage', label: 'Datasets' },
      ],
    },
    {
      id: 'dataset-tools',
      label: 'Dataset Tools',
      links: [
        { path: '/validate', icon: 'fact_check', label: 'Validate' },
        { path: '/playernames', icon: 'badge', label: 'Playernames' },
        { path: '/export', icon: 'drive_file_move', label: 'Export' },
      ],
    },
  ];

  protected openAbout(): void {
    this.dialog.open(AboutDialog, {
      width: '700px',
      maxWidth: 'calc(100vw - 2rem)',
      autoFocus: 'dialog',
    });
  }
}
