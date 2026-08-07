import type { PlayernameIdProfile } from '../../../../shared/contracts';
import type { DatasetIdRangeModel, DatasetIdRun } from './dataset-id-range-layout';

export type PlayernameIdTable = 'playernames' | 'dcplayernames';

export interface PlayernameIdRangeSource {
  table: PlayernameIdTable;
  profile: PlayernameIdProfile;
}

interface RangeGroup {
  min: number;
  max: number;
  sources: PlayernameIdRangeSource[];
}

const TABLE_ORDER: Record<PlayernameIdTable, number> = { playernames: 0, dcplayernames: 1 };

const sortedLabels = (sources: readonly PlayernameIdRangeSource[]): string[] =>
  [...new Set(sources.map((source) => source.table))].sort(
    (left, right) => TABLE_ORDER[left] - TABLE_ORDER[right],
  );

const mergeRun = (runs: DatasetIdRun[], next: DatasetIdRun): void => {
  const previous = runs.at(-1);
  const sameSources =
    previous !== undefined &&
    previous.sourceLabels?.length === next.sourceLabels?.length &&
    previous.sourceLabels?.every((label, index) => label === next.sourceLabels?.[index]);
  if (
    previous &&
    previous.state === next.state &&
    sameSources &&
    previous.endId + 1 === next.startId
  ) {
    previous.endId = next.endId;
    previous.count += next.count;
    return;
  }
  runs.push(next);
};

const rangeGroups = (sources: readonly PlayernameIdRangeSource[]): RangeGroup[] => {
  const groups: RangeGroup[] = [];
  const sorted = [...sources].sort(
    (left, right) =>
      left.profile.rangeMin - right.profile.rangeMin ||
      left.profile.rangeMax - right.profile.rangeMax ||
      TABLE_ORDER[left.table] - TABLE_ORDER[right.table],
  );
  for (const source of sorted) {
    const previous = groups.at(-1);
    if (previous && source.profile.rangeMin <= previous.max + 1) {
      previous.max = Math.max(previous.max, source.profile.rangeMax);
      previous.sources.push(source);
    } else {
      groups.push({
        min: source.profile.rangeMin,
        max: source.profile.rangeMax,
        sources: [source],
      });
    }
  }
  return groups;
};

const overflowRun = (
  source: PlayernameIdRangeSource,
  side: 'belowRange' | 'aboveRange',
): DatasetIdRun | undefined => {
  const overflow = source.profile[side];
  if (!overflow.count) return undefined;
  const below = side === 'belowRange';
  return {
    state: below ? 'below-range' : 'above-range',
    startId: overflow.min ?? (below ? source.profile.rangeMin - 1 : source.profile.rangeMax + 1),
    endId: overflow.max ?? (below ? source.profile.rangeMin - 1 : source.profile.rangeMax + 1),
    count: overflow.count,
    samples: overflow.samples,
    sourceLabels: [source.table],
  };
};

const exactRuns = (sources: readonly PlayernameIdRangeSource[]): DatasetIdRun[] => {
  const occupied = new Map<PlayernameIdTable, Set<number>>(
    sources.map((source) => [source.table, new Set(source.profile.occupiedIds)]),
  );
  const runs: DatasetIdRun[] = [];
  for (const group of rangeGroups(sources)) {
    for (let id = group.min; id <= group.max; id += 1) {
      for (const source of group.sources) {
        if (source.profile.rangeMax === id - 1) {
          const overflow = overflowRun(source, 'aboveRange');
          if (overflow) runs.push(overflow);
        }
        if (source.profile.rangeMin === id) {
          const overflow = overflowRun(source, 'belowRange');
          if (overflow) runs.push(overflow);
        }
      }
      const applicable = group.sources.filter(
        (source) => id >= source.profile.rangeMin && id <= source.profile.rangeMax,
      );
      const occupiedBy = applicable.filter((source) => occupied.get(source.table)?.has(id));
      const state = occupiedBy.length
        ? 'occupied'
        : applicable.some(
              (source) => source.profile.activeMax !== undefined && id <= source.profile.activeMax,
            )
          ? 'hole'
          : 'capacity';
      mergeRun(runs, {
        state,
        startId: id,
        endId: id,
        count: 1,
        sourceLabels: sortedLabels(occupiedBy.length ? occupiedBy : applicable),
      });
    }
    for (const source of group.sources) {
      if (source.profile.rangeMax === group.max) {
        const overflow = overflowRun(source, 'aboveRange');
        if (overflow) runs.push(overflow);
      }
    }
  }
  return runs;
};

export const createPlayernameIdRangeUnion = (
  sources: readonly PlayernameIdRangeSource[],
): DatasetIdRangeModel => {
  const exact = sources.every((source) => source.profile.occupiedIds !== undefined);
  const runs = exact ? exactRuns(sources) : [];
  const count = (state: DatasetIdRun['state']): number =>
    runs.filter((run) => run.state === state).reduce((total, run) => total + run.count, 0);
  return {
    exact,
    runs,
    ranges: [...sources]
      .sort(
        (left, right) =>
          left.profile.rangeMin - right.profile.rangeMin ||
          TABLE_ORDER[left.table] - TABLE_ORDER[right.table],
      )
      .map(({ table, profile }) => ({
        label: table,
        min: profile.rangeMin,
        max: profile.rangeMax,
      })),
    breakdowns: sources.map(({ table, profile }) => ({
      label: table,
      occupiedCount: profile.occupiedCount,
      holeCount: profile.holeCount,
      capacityCount: profile.capacityCount,
      outOfRangeCount: profile.outOfRangeCount,
    })),
    occupiedCount: exact
      ? count('occupied')
      : sources.reduce((total, source) => total + source.profile.occupiedCount, 0),
    holeCount: exact
      ? count('hole')
      : sources.reduce((total, source) => total + source.profile.holeCount, 0),
    capacityCount: exact
      ? count('capacity')
      : sources.reduce((total, source) => total + source.profile.capacityCount, 0),
    outOfRangeCount: exact
      ? count('below-range') + count('above-range')
      : sources.reduce((total, source) => total + source.profile.outOfRangeCount, 0),
  };
};
