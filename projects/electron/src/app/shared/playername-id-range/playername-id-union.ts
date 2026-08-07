import { Component, computed, input } from '@angular/core';

import type { PlayernameTableSummary } from '../../../../shared/contracts';
import { DatasetIdRange } from './playername-id-range';
import {
  type PlayernameIdRangeSource,
  createPlayernameIdRangeUnion,
} from './playername-id-range-union';

@Component({
  selector: 'app-playername-id-union',
  imports: [DatasetIdRange],
  template: ` <app-dataset-id-range [label]="label()" [rangeModel]="model()" /> `,
  host: { class: 'block' },
})
export class PlayernameIdUnion {
  readonly label = input.required<string>();
  readonly tables = input.required<readonly PlayernameIdRangeSource[]>();

  protected readonly model = computed(() => createPlayernameIdRangeUnion(this.tables()));
}

export const playernameSummaryProfiles = (
  summaries: readonly PlayernameTableSummary[],
  phase: 'before' | 'after',
): PlayernameIdRangeSource[] =>
  summaries.flatMap((summary) => {
    const profile = phase === 'before' ? summary.beforeIdProfile : summary.afterIdProfile;
    return profile ? [{ table: summary.table, profile }] : [];
  });
