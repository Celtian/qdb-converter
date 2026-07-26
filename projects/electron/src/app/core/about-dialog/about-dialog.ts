import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

import { VERSION_INFO } from '../../../../../version-info';

@Component({
  selector: 'app-about-dialog',
  imports: [NgOptimizedImage, MatButtonModule, MatDialogModule],
  templateUrl: './about-dialog.html',
  styleUrl: './about-dialog.css',
})
export class AboutDialog {
  protected readonly version = VERSION_INFO.version;
}
