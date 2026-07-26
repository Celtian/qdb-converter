import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-about-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './about-dialog.html',
  styleUrl: './about-dialog.css',
})
export class AboutDialog {}
