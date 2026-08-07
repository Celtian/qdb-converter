import type { PlayernameIdProfile } from '../../../../shared/contracts';

export const datasetIdRangeProfileFixture: PlayernameIdProfile = {
  rangeMin: 0,
  rangeMax: 49_999,
  activeMax: 390,
  occupiedIds: [-1, 0, 195, 390, 50_001],
  occupiedCount: 3,
  holeCount: 388,
  capacityCount: 49_609,
  outOfRangeCount: 2,
  belowRange: { count: 1, min: -1, max: -1, samples: [-1] },
  aboveRange: { count: 1, min: 50_001, max: 50_001, samples: [50_001] },
  buckets: [],
};
