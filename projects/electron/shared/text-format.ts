export type TableValue = string | number;
export type TableRow = Record<string, TableValue>;

export interface ParsedTextTable {
  headers: string[];
  rows: TableRow[];
}

const parseCells = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === '\t' && !quoted) {
      row.push(value);
      value = '';
    } else if ((character === '\r' || character === '\n') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }
  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  if (quoted) throw new Error('The text table contains an unterminated quoted value.');
  return rows;
};

export const decodeFifaText = (buffer: Uint8Array): string => {
  if (buffer.byteLength < 2 || buffer[0] !== 0xff || buffer[1] !== 0xfe)
    throw new Error('DB Master text files must use UTF-16LE with a byte-order mark.');
  if (buffer.byteLength % 2 !== 0) throw new Error('The UTF-16LE file is truncated.');
  return Buffer.from(buffer.subarray(2)).toString('utf16le');
};

export const parseTextTable = (buffer: Uint8Array): ParsedTextTable => {
  const rows = parseCells(decodeFifaText(buffer));
  const headers = rows.shift()?.map((header) => header.trim().toLocaleLowerCase('en')) ?? [];
  if (!headers.length || headers.some((header) => !header))
    throw new Error('The table header is empty or invalid.');
  if (new Set(headers).size !== headers.length) throw new Error('The table header is duplicated.');
  return {
    headers,
    rows: rows.map((cells, rowIndex) => {
      if (cells.length !== headers.length)
        throw new Error(
          `Row ${rowIndex + 2} has ${cells.length} values; ${headers.length} were expected.`,
        );
      return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
    }),
  };
};

const encodeCell = (value: TableValue): string => {
  const text = String(value);
  return /[\t\r\n"]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const encodeFifaText = (headers: string[], rows: TableRow[]): Buffer => {
  const lines = [
    headers.map(encodeCell).join('\t'),
    ...rows.map((row) => headers.map((header) => encodeCell(row[header] ?? '')).join('\t')),
  ];
  return Buffer.concat([
    Buffer.from([0xff, 0xfe]),
    Buffer.from(`${lines.join('\r\n')}\r\n`, 'utf16le'),
  ]);
};
