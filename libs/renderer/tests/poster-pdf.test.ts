import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, PDFRawStream, PDFName, PDFNumber } from "pdf-lib";
import { withCancellation } from "../src/export-task";
import { wrapJpegInPdf } from "../src/pdf";

void test("cancellation settles a browser operation that never responds", async () => {
  const controller = new AbortController();
  const pending = withCancellation(Promise.race<void>([]), controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(await withCancellation(Promise.resolve("ready")), "ready");
});

function jpegBytes(width: number, height: number): Uint8Array {
  // prettier-ignore
  const sof = [
    0xff, 0xc0, 0x00, 0x11, 0x08,
    (height >> 8) & 0xff, height & 0xff,
    (width >> 8) & 0xff, width & 0xff,
    0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
  ];
  // prettier-ignore
  return new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01,
    0x01, 0x2c, 0x01, 0x2c, 0x00, 0x00,
    ...sof,
    0xff, 0xd9,
  ]);
}

void test("PDF embeds the final JPEG bytes unchanged on a correctly sized print page", async () => {
  const jpeg = jpegBytes(513, 259);
  const result = await wrapJpegInPdf(jpeg, 594, 841);
  if (result.isErr()) throw result.error;
  const pdf = await PDFDocument.load(result.value);
  assert.equal(pdf.getPageCount(), 1);
  const page = pdf.getPage(0);
  assert.ok(Math.abs(page.getWidth() - (594 * 72) / 25.4) < 1e-6);
  assert.ok(Math.abs(page.getHeight() - (841 * 72) / 25.4) < 1e-6);
  const images = pdf.context
    .enumerateIndirectObjects()
    .map(([, object]) => object)
    .filter(
      (object): object is PDFRawStream =>
        object instanceof PDFRawStream &&
        object.dict.get(PDFName.of("Subtype"))?.toString() === "/Image",
    );
  assert.equal(images.length, 1);
  assert.deepEqual(images[0].getContents(), jpeg);
  assert.equal(images[0].dict.lookup(PDFName.of("Width"), PDFNumber).asNumber(), 513);
  assert.equal(images[0].dict.lookup(PDFName.of("Height"), PDFNumber).asNumber(), 259);
});
