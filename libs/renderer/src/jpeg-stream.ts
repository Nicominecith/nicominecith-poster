const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const DRI = 0xdd;
const DQT = 0xdb;
const DHT = 0xc4;
const APP0 = 0xe0;
const SOF0 = 0xc0;
const RST0 = 0xd0;
const RST7 = 0xd7;
const FRAME_COMPONENT_OFFSET = 6;
const FRAME_COMPONENT_LENGTH = 3;

type Segment = { marker: number; body: Uint8Array };
type Parsed = { segments: Segment[]; scan: Uint8Array; frameMarker: number; frame: Uint8Array };

function isRestart(marker: number) {
  return marker >= RST0 && marker <= RST7;
}

function parse(bytes: Uint8Array): Parsed {
  if (bytes[0] !== 0xff || bytes[1] !== SOI) throw new Error("Not a JPEG");
  const segments: Segment[] = [];
  let frameMarker = 0;
  let frame = new Uint8Array();
  let offset = 2;
  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) throw new Error("Malformed JPEG");
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === EOI) break;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    const body = bytes.subarray(offset + 2, offset + length);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== DHT && marker !== 0xc8 && marker !== 0xcc) {
      frameMarker = marker;
      frame = new Uint8Array(body);
    }
    segments.push({ marker, body });
    if (marker === SOS) {
      let end = offset + length;
      while (end < bytes.length - 1) {
        if (bytes[end] !== 0xff) {
          end++;
          continue;
        }
        const next = bytes[end + 1];
        if (next === 0xff || next === 0 || isRestart(next)) {
          end++;
          continue;
        }
        break;
      }
      return { segments, scan: bytes.subarray(offset + length, end), frameMarker, frame };
    }
    offset += length;
  }
  throw new Error("JPEG without scan");
}

function bodies(parsed: Parsed, marker: number) {
  return parsed.segments.filter((segment) => segment.marker === marker).map(({ body }) => body);
}

function same(a: Uint8Array, b: Uint8Array) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function compatible(strips: Parsed[]) {
  const [first, ...rest] = strips;
  if (first?.frameMarker !== SOF0) return false;
  const componentCount = first.frame[5];
  const shape = first.frame.subarray(
    3,
    FRAME_COMPONENT_OFFSET + componentCount * FRAME_COMPONENT_LENGTH,
  );
  return rest.every(
    (strip) =>
      strip.frameMarker === SOF0 &&
      same(
        strip.frame.subarray(3, FRAME_COMPONENT_OFFSET + strip.frame[5] * FRAME_COMPONENT_LENGTH),
        shape,
      ) &&
      [DQT, DHT].every((marker) => {
        const expected = bodies(first, marker);
        const actual = bodies(strip, marker);
        return (
          actual.length === expected.length &&
          actual.every((body, index) => same(body, expected[index]))
        );
      }),
  );
}

export function jpegStripCompatibilityIssue(strips: EncodedJpegStrip[]): string {
  const parsed = strips.map(({ bytes }) => parse(bytes));
  const first = parsed[0];
  if (!first) return "no strips";
  if (first.frameMarker !== SOF0) return `first frame marker ${first.frameMarker.toString(16)}`;
  for (let index = 1; index < parsed.length; index++) {
    const strip = parsed[index];
    if (strip.frameMarker !== SOF0)
      return `strip ${index} frame marker ${strip.frameMarker.toString(16)}`;
    for (const marker of [DQT, DHT]) {
      const expected = bodies(first, marker);
      const actual = bodies(strip, marker);
      if (actual.length !== expected.length)
        return `strip ${index} marker ${marker.toString(16)} count`;
      const mismatch = actual.findIndex((body, bodyIndex) => !same(body, expected[bodyIndex]));
      if (mismatch >= 0) return `strip ${index} marker ${marker.toString(16)} body ${mismatch}`;
    }
    const componentCount = first.frame[5];
    const end = FRAME_COMPONENT_OFFSET + componentCount * FRAME_COMPONENT_LENGTH;
    if (!same(strip.frame.subarray(3, end), first.frame.subarray(3, end)))
      return `strip ${index} frame shape`;
  }
  return "restart geometry";
}

type EncodedJpegStrip = { bytes: Uint8Array; height: number };

export function spliceJpegStrips(strips: EncodedJpegStrip[], dpi: number): Uint8Array | undefined {
  if (strips.length === 0) return undefined;
  const parsed = strips.map(({ bytes }) => parse(bytes));
  if (!compatible(parsed)) return undefined;
  const first = parsed[0];
  const components = first.frame[5];
  let maxHorizontal = 1;
  let maxVertical = 1;
  for (let index = 0; index < components; index++) {
    const sampling = first.frame[FRAME_COMPONENT_OFFSET + index * FRAME_COMPONENT_LENGTH + 1];
    maxHorizontal = Math.max(maxHorizontal, sampling >> 4);
    maxVertical = Math.max(maxVertical, sampling & 15);
  }
  const width = (first.frame[3] << 8) | first.frame[4];
  const mcuHeight = 8 * maxVertical;
  const mcusPerRow = Math.ceil(width / (8 * maxHorizontal));
  const totalHeight = strips.reduce((sum, strip) => sum + strip.height, 0);
  const interval = mcusPerRow * Math.ceil(strips[0].height / mcuHeight);
  if (totalHeight > 65535 || interval < 1 || interval > 65535) return undefined;
  if (strips.some((strip, index) => index < strips.length - 1 && strip.height % mcuHeight !== 0))
    return undefined;

  const header: number[] = [0xff, SOI];
  const push = (marker: number, body: ArrayLike<number>) => {
    header.push(0xff, marker, (body.length + 2) >> 8, (body.length + 2) & 0xff);
    header.push(...Array.from(body));
  };
  push(APP0, [
    0x4a,
    0x46,
    0x49,
    0x46,
    0,
    1,
    1,
    1,
    dpi >> 8,
    dpi & 0xff,
    dpi >> 8,
    dpi & 0xff,
    0,
    0,
  ]);
  for (const body of bodies(first, DQT)) push(DQT, body);
  const frame = new Uint8Array(first.frame);
  frame[1] = totalHeight >> 8;
  frame[2] = totalHeight & 0xff;
  push(SOF0, frame);
  for (const body of bodies(first, DHT)) push(DHT, body);
  push(DRI, [interval >> 8, interval & 0xff]);
  push(SOS, bodies(first, SOS)[0]);

  const scanLength = parsed.reduce((sum, strip) => sum + strip.scan.length, 0);
  const output = new Uint8Array(header.length + scanLength + (parsed.length - 1) * 2 + 2);
  output.set(header);
  let offset = header.length;
  let restart = 0;
  parsed.forEach((strip, index) => {
    output.set(strip.scan, offset);
    offset += strip.scan.length;
    if (index < parsed.length - 1) {
      output[offset++] = 0xff;
      output[offset++] = RST0 + (restart++ % 8);
    }
  });
  output[offset++] = 0xff;
  output[offset++] = EOI;
  return output.subarray(0, offset);
}
