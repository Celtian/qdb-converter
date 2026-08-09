import { ArrayIncludesPipe, ArrayJoinPipe, SetHasPipe } from './template-value-pipes';

describe('template value pipes', () => {
  it('checks array membership and handles nullish arrays', () => {
    const pipe = new ArrayIncludesPipe();

    expect(pipe.transform(['players', 'teams'], 'players')).toBe(true);
    expect(pipe.transform(['players', 'teams'], 'leagues')).toBe(false);
    expect(pipe.transform(undefined, 'players')).toBe(false);
    expect(pipe.transform(null, 'players')).toBe(false);
  });

  it('joins arrays with default and custom separators and handles nullish arrays', () => {
    const pipe = new ArrayJoinPipe();

    expect(pipe.transform(['players', 'teams'])).toBe('players, teams');
    expect(pipe.transform(['players', 'teams'], ' · ')).toBe('players · teams');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(null)).toBe('');
  });

  it('checks set membership and handles nullish sets', () => {
    const pipe = new SetHasPipe();

    expect(pipe.transform(new Set(['players']), 'players')).toBe(true);
    expect(pipe.transform(new Set(['players']), 'teams')).toBe(false);
    expect(pipe.transform(undefined, 'players')).toBe(false);
    expect(pipe.transform(null, 'players')).toBe(false);
  });
});
