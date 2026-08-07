import type { PlayernameIdProfile } from '../../../../shared/contracts';
import { type DatasetIdRangeModel, createDatasetIdRuns } from './dataset-id-range-layout';

export type PlayernameIdTable = 'playernames' | 'dcplayernames';

export interface PlayernameIdRangeSource {
  table: PlayernameIdTable;
  profile: PlayernameIdProfile;
}

const TABLE_ORDER: Record<PlayernameIdTable, number> = { playernames: 0, dcplayernames: 1 };

export const createPlayernameIdRangeLanes = (
  sources: readonly PlayernameIdRangeSource[],
): DatasetIdRangeModel => {
  const orderedSources = [...sources].sort(
    (left, right) => TABLE_ORDER[left.table] - TABLE_ORDER[right.table],
  );
  const exact = orderedSources.every((source) => source.profile.occupiedIds !== undefined);
  return {
    exact,
    lanes: orderedSources.map(({ table, profile }) => ({
      label: table,
      min: profile.rangeMin,
      max: profile.rangeMax,
      runs: exact
        ? createDatasetIdRuns(profile).map((run) => ({ ...run, sourceLabels: [table] }))
        : [],
    })),
    ranges: orderedSources.map(({ table, profile }) => ({
      label: table,
      min: profile.rangeMin,
      max: profile.rangeMax,
    })),
    breakdowns: orderedSources.map(({ table, profile }) => ({
      label: table,
      occupiedCount: profile.occupiedCount,
      holeCount: profile.holeCount,
      capacityCount: profile.capacityCount,
      outOfRangeCount: profile.outOfRangeCount,
    })),
    occupiedCount: orderedSources.reduce(
      (total, source) => total + source.profile.occupiedCount,
      0,
    ),
    holeCount: orderedSources.reduce((total, source) => total + source.profile.holeCount, 0),
    capacityCount: orderedSources.reduce(
      (total, source) => total + source.profile.capacityCount,
      0,
    ),
    outOfRangeCount: orderedSources.reduce(
      (total, source) => total + source.profile.outOfRangeCount,
      0,
    ),
  };
};
