import { ResultAsync } from "neverthrow";
import { PDFDocument, type PDFImage } from "pdf-lib";
import { toError } from "@freetsy/utils";
import i18n from "@freetsy/i18n";
import { MM_PER_INCH } from "@freetsy/poster";

const POINTS_PER_INCH = 72;
const MM_TO_PT = POINTS_PER_INCH / MM_PER_INCH;

export function wrapJpegInPdf(
  jpegBytes: Uint8Array,
  widthMm: number,
  heightMm: number,
): ResultAsync<Uint8Array, Error> {
  return ResultAsync.fromPromise(PDFDocument.create(), (cause) =>
    toError(cause, i18n.t("errors.pdfCreate")),
  ).andThen((pdfDoc) =>
    ResultAsync.fromPromise(pdfDoc.embedJpg(jpegBytes), (cause) =>
      toError(cause, i18n.t("errors.pdfEmbed")),
    ).andThen((image) => savePdfPage(pdfDoc, image, widthMm, heightMm)),
  );
}

function savePdfPage(
  pdfDoc: PDFDocument,
  image: PDFImage,
  widthMm: number,
  heightMm: number,
): ResultAsync<Uint8Array, Error> {
  const pageWidthPt = widthMm * MM_TO_PT;
  const pageHeightPt = heightMm * MM_TO_PT;
  const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
  page.drawImage(image, { x: 0, y: 0, width: pageWidthPt, height: pageHeightPt });

  return ResultAsync.fromPromise(pdfDoc.save(), (cause) =>
    toError(cause, i18n.t("errors.pdfSave")),
  );
}
