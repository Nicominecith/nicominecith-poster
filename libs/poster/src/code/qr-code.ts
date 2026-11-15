import { ResultAsync } from "neverthrow";
import { toError } from "@freetsy/utils";
import i18n from "@freetsy/i18n";

const QUIET_ZONE_MODULES = 1;

export function qrCodeDataUri(targetUrl: string, color: string): ResultAsync<string, Error> {
  return ResultAsync.fromPromise(
    (async () => {
      const { default: qrcode } = await import("qrcode");
      return qrcode.toDataURL(targetUrl, {
        type: "image/png",
        margin: QUIET_ZONE_MODULES,
        color: { dark: color, light: "#0000" },
        width: 512,
      });
    })(),
    (cause) => toError(cause, i18n.t("errors.qrCreate")),
  );
}

export function qrCodeColor(variant: "light" | "dark"): string {
  return variant === "dark" ? "#ffffff" : "#000000";
}
