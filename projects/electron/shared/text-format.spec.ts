import { describe, expect, it } from 'vitest';
import { decodeFifaText, encodeFifaText, parseTextTable } from './text-format';

describe('DB Master text format', () => {
  it('round trips quoted UTF-16LE tabular values', () => {
    const encoded = encodeFifaText(
      ['playerid', 'name'],
      [{ playerid: 1, name: 'A "quoted"\tname' }],
    );
    expect(decodeFifaText(encoded)).toContain('playerid\tname');
    expect(parseTextTable(encoded).rows).toEqual([{ playerid: '1', name: 'A "quoted"\tname' }]);
  });

  it('rejects files without a UTF-16LE BOM', () => {
    expect(() => decodeFifaText(Buffer.from('players'))).toThrow(/UTF-16LE/);
  });

  it('rejects malformed rows', () => {
    const buffer = Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from('a\tb\r\n1\r\n', 'utf16le'),
    ]);
    expect(() => parseTextTable(buffer)).toThrow(/2 were expected/);
  });

  it('accepts LF rows, blank rows, trailing rows, and quoted newlines', () => {
    const buffer = Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from('a\tb\n\n1\t"line\nwith ""quotes"""', 'utf16le'),
    ]);
    expect(parseTextTable(buffer).rows[0]).toEqual({ a: '1', b: 'line\nwith "quotes"' });
  });

  it('rejects invalid encoding, headers, and quotes', () => {
    expect(() => decodeFifaText(Buffer.from([]))).toThrow(/byte-order/);
    expect(() => decodeFifaText(Buffer.from([0xff, 0xfe, 0x00]))).toThrow(/truncated/);
    const encoded = (value: string) =>
      Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(value, 'utf16le')]);
    expect(() => parseTextTable(encoded('a\ta\r\n'))).toThrow(/duplicated/);
    expect(() => parseTextTable(encoded('\t\r\n'))).toThrow(/empty/);
    expect(() => parseTextTable(encoded('a\r\n"open'))).toThrow(/unterminated/);
  });

  it('writes absent row values as empty cells', () => {
    expect(parseTextTable(encodeFifaText(['a', 'b'], [{ a: 1 }])).rows[0]).toEqual({
      a: '1',
      b: '',
    });
  });
});
