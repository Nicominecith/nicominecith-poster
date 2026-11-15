import i18n from "@freetsy/i18n";

const SIMD_PROBE = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15,
  253, 98, 11,
]);

let supported: boolean | undefined;

function posterRendererIsSupported(): boolean {
  supported ??= typeof WebAssembly === "object" && WebAssembly.validate(SIMD_PROBE);
  return supported;
}

export function posterRendererUnsupportedError(): Error | null {
  return posterRendererIsSupported() ? null : new Error(i18n.t("errors.browserTooOld"));
}
