import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header
      class="sticky top-0 z-2 -mx-8 -mt-8 mb-6 flex items-start justify-between gap-4 border-b border-outline-variant bg-surface px-8 pt-8 pb-6 max-nav:-mx-4 max-nav:-mt-4 max-nav:flex-col max-nav:px-4 max-nav:pt-4"
    >
      <div>
        <h1 class="m-0 mb-1 text-3xl font-bold" [id]="headingId()">{{ heading() }}</h1>
        <p class="m-0 text-lg text-on-surface-variant">{{ description() }}</p>
      </div>
      <ng-content />
    </header>
  `,
  host: {
    class: 'block',
  },
})
export class PageHeader {
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
  readonly headingId = input<string>();
}
