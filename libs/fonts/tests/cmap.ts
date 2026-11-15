import assert from "node:assert/strict";

export function codePoints(bytes: Uint8Array): Set<number> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tableCount = view.getUint16(4);
  let cmap = -1;
  for (let i = 0; i < tableCount; i++) {
    const record = 12 + 16 * i;
    const tag = String.fromCharCode(...bytes.subarray(record, record + 4));
    if (tag === "cmap") cmap = view.getUint32(record + 8);
  }
  assert.notEqual(cmap, -1, "font has no cmap table");

  let best = -1;
  for (let i = 0; i < view.getUint16(cmap + 2); i++) {
    const subtable = cmap + view.getUint32(cmap + 4 + 8 * i + 4);
    const format = view.getUint16(subtable);
    if (format === 12) {
      best = subtable;
      break;
    }
    if (format === 4 && best === -1) best = subtable;
  }
  assert.notEqual(best, -1, "font maps no characters through a format 4 or 12 subtable");

  const covered = new Set<number>();
  if (view.getUint16(best) === 12) {
    const groups = view.getUint32(best + 12);
    for (let i = 0; i < groups; i++) {
      const group = best + 16 + 12 * i;
      for (let c = view.getUint32(group); c <= view.getUint32(group + 4); c++) covered.add(c);
    }
    return covered;
  }

  const segments = view.getUint16(best + 6) / 2;
  const ends = best + 14;
  const starts = ends + segments * 2 + 2;
  const deltas = starts + segments * 2;
  const rangeOffsets = deltas + segments * 2;
  for (let i = 0; i < segments; i++) {
    const end = view.getUint16(ends + i * 2);
    const start = view.getUint16(starts + i * 2);
    const delta = view.getInt16(deltas + i * 2);
    const rangeOffset = view.getUint16(rangeOffsets + i * 2);
    for (let c = start; c <= Math.min(end, 0xfffe); c++) {
      let glyph: number;
      if (rangeOffset === 0) glyph = (c + delta) & 0xffff;
      else {
        const at = rangeOffsets + i * 2 + rangeOffset + (c - start) * 2;
        if (at + 2 > bytes.byteLength) continue;
        glyph = view.getUint16(at);
        if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
      }
      if (glyph !== 0) covered.add(c);
    }
  }
  return covered;
}
