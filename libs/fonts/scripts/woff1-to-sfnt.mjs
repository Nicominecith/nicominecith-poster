// Un-wraps a WOFF (version 1) container back into a plain sfnt font. Only two
// bundled files (Inter) predate woff2, and `wawoff2` only speaks woff2's own
// brotli-based container, so this is the one format it cannot also convert.
import { inflateSync } from "node:zlib";

const HEADER_SIZE = 44;
const DIRECTORY_ENTRY_SIZE = 20;
const SFNT_TABLE_ENTRY_SIZE = 16;

export function woff1ToSfnt(buffer) {
  if (buffer.readUInt32BE(0) !== 0x774f4646) throw new Error("Not a WOFF file");
  const flavor = buffer.readUInt32BE(4);
  const numTables = buffer.readUInt16BE(12);

  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const entryOffset = HEADER_SIZE + i * DIRECTORY_ENTRY_SIZE;
    const tag = buffer.subarray(entryOffset, entryOffset + 4);
    const offset = buffer.readUInt32BE(entryOffset + 4);
    const compLength = buffer.readUInt32BE(entryOffset + 8);
    const origLength = buffer.readUInt32BE(entryOffset + 12);
    const origChecksum = buffer.readUInt32BE(entryOffset + 16);
    const compressed = buffer.subarray(offset, offset + compLength);
    const data = compLength < origLength ? inflateSync(compressed) : compressed;
    tables.push({ tag, data, origChecksum });
  }

  let searchRange = 1;
  let entrySelector = 0;
  while (searchRange * 2 <= numTables) {
    searchRange *= 2;
    entrySelector += 1;
  }
  searchRange *= 16;
  const rangeShift = numTables * 16 - searchRange;

  const directorySize = SFNT_TABLE_ENTRY_SIZE * numTables;
  let bodyOffset = 12 + directorySize;
  const layout = tables.map((table) => {
    const offset = bodyOffset;
    bodyOffset += table.data.length;
    if (bodyOffset % 4 !== 0) bodyOffset += 4 - (bodyOffset % 4);
    return { ...table, offset };
  });

  const out = Buffer.alloc(bodyOffset);
  out.writeUInt32BE(flavor, 0);
  out.writeUInt16BE(numTables, 4);
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(entrySelector, 8);
  out.writeUInt16BE(rangeShift, 10);

  layout.forEach((table, i) => {
    const entryOffset = 12 + i * SFNT_TABLE_ENTRY_SIZE;
    table.tag.copy(out, entryOffset);
    out.writeUInt32BE(table.origChecksum, entryOffset + 4);
    out.writeUInt32BE(table.offset, entryOffset + 8);
    out.writeUInt32BE(table.data.length, entryOffset + 12);
    table.data.copy(out, table.offset);
  });

  return out;
}
