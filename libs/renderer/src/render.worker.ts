import initLatin, * as latin from "../wasm/poster-render/poster_render.js";
import initScripts, * as scripts from "../wasm/poster-render-scripts/poster_render.js";
import type { RendererEngine } from "./renderer-engine";

export type RenderRequest = {
  id: number;
  engine: RendererEngine;
  requestJson: string;
  pixelArena: ArrayBuffer;
  fontArena: ArrayBuffer;
  output: { kind: "rgba" } | { kind: "jpeg"; dpi: number; quality: number };
};

export type RenderResponse =
  { id: number; type: "done"; bytes: ArrayBuffer } | { id: number; type: "error"; message: string };

const ENGINES = {
  latin: { init: initLatin, renderJpeg: latin.render_jpeg, renderRgba: latin.render_rgba },
  scripts: { init: initScripts, renderJpeg: scripts.render_jpeg, renderRgba: scripts.render_rgba },
};
const ready: Partial<Record<RendererEngine, Promise<unknown>>> = {};

function transferable(bytes: Uint8Array): ArrayBuffer {
  const { buffer } = bytes;
  if (!(buffer instanceof ArrayBuffer)) throw new TypeError("Renderer returned shared memory");
  return buffer;
}

self.onmessage = ({ data }: MessageEvent<RenderRequest>) => {
  const engine = ENGINES[data.engine];
  const loaded = ready[data.engine] ?? engine.init();
  ready[data.engine] = loaded;
  void loaded
    .then(() => {
      const pixels = new Uint8Array(data.pixelArena);
      const fonts = new Uint8Array(data.fontArena);
      let bytes: Uint8Array;
      if (data.output.kind === "jpeg") {
        const { dpi, quality } = data.output;
        bytes = engine.renderJpeg(data.requestJson, pixels, fonts, dpi, quality);
      } else {
        bytes = engine.renderRgba(data.requestJson, pixels, fonts);
      }
      const buffer = transferable(bytes);
      const response: RenderResponse = { id: data.id, type: "done", bytes: buffer };
      self.postMessage(response, { transfer: [buffer] });
    })
    .catch((error: unknown) => {
      const response: RenderResponse = {
        id: data.id,
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      };
      self.postMessage(response);
    });
};
