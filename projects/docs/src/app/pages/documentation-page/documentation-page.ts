import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { DocumentationContent } from '../../documentation';

@Component({
  selector: 'app-documentation-page',
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './documentation-page.html',
  styleUrl: './documentation-page.css',
})
export class DocumentationPage {
  protected readonly content = inject(ActivatedRoute).snapshot.data[
    'content'
  ] as DocumentationContent;
}
