import initLatin, * as latin from "../wasm/poster-render/poster_render.js";
import initScripts, * as scripts from "../wasm/poster-render-scripts/poster_render.js";
import type { RendererEngine } from "./renderer-engine";

type StripRequest =
  | {
      type: "init";
      engine: RendererEngine;
      requestJson: string;
      pixelArena: ArrayBuffer;
      fontArena: ArrayBuffer;
      module?: WebAssembly.Module;
      dpi: number;
      quality: number;
    }
  | { type: "render"; id: number; y: number; height: number };

export type StripResponse =
  | { type: "ready" }
  | { type: "done"; id: number; bytes: ArrayBuffer }
  | { type: "error"; id?: number; message: string };

const ENGINES = {
  latin: { init: initLatin, Renderer: latin.PosterStripRenderer },
  scripts: { init: initScripts, Renderer: scripts.PosterStripRenderer },
};

let renderer: latin.PosterStripRenderer | scripts.PosterStripRenderer | undefined;
let engine: (typeof ENGINES)[RendererEngine] | undefined;
let dpi = 0;
let quality = 0;
let ready: Promise<unknown> | undefined;

function respond(message: StripResponse, transfer: Transferable[] = []) {
  self.postMessage(message, { transfer });
}

self.onmessage = ({ data }: MessageEvent<StripRequest>) => {
  if (data.type === "init") engine ??= ENGINES[data.engine];
  if (!engine) {
    respond({ type: "error", message: "Strip worker is not initialized" });
    return;
  }
  const { init, Renderer } = engine;
  ready ??= init(data.type === "init" && data.module ? { module_or_path: data.module } : undefined);
  void ready
    .then(() => {
      if (data.type === "init") {
        renderer = new Renderer(
          data.requestJson,
          new Uint8Array(data.pixelArena),
          new Uint8Array(data.fontArena),
        );
        dpi = data.dpi;
        quality = data.quality;
        respond({ type: "ready" });
        return;
      }
      if (!renderer) throw new Error("Strip worker is not initialized");
      const bytes = renderer.render_jpeg(data.y, data.height, dpi, quality);
      if (!(bytes.buffer instanceof ArrayBuffer))
        throw new Error("Renderer returned shared memory");
      respond({ type: "done", id: data.id, bytes: bytes.buffer }, [bytes.buffer]);
    })
    .catch((error: unknown) => {
      respond({
        type: "error",
        id: data.type === "render" ? data.id : undefined,
        message: error instanceof Error ? error.message : String(error),
      });
    });
};
