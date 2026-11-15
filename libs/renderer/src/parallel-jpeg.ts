import { noop } from "@freetsy/utils";
import { jpegStripCompatibilityIssue, spliceJpegStrips } from "./jpeg-stream";
import type { StripResponse } from "./strip.worker";
import latinWasmUrl from "../wasm/poster-render/poster_render_bg.wasm?url";
import scriptsWasmUrl from "../wasm/poster-render-scripts/poster_render_bg.wasm?url";
import type { RendererEngine } from "./renderer-engine";

const WASM_URLS: Record<RendererEngine, string> = {
  latin: latinWasmUrl,
  scripts: scriptsWasmUrl,
};

const CHANNELS = 4;
const MAX_STRIP_BYTES = 32 * 1024 * 1024;
const STRIP_ALLOWANCE_BYTES = 8 * 1024 * 1024;
const MAX_STRIP_ROWS = 512;
const MIN_STRIP_ROWS = 128;
const STRIPS_PER_WORKER = 3;
const ROW_ALIGNMENT = 16;

type Strip = { y: number; height: number };

function strips(width: number, height: number, quality: number, workers: number): Strip[] {
  const mcuEdge = quality >= 90 ? 8 : 16;
  const mcusPerRow = Math.ceil(width / mcuEdge);
  const rowsByRestart = Math.floor(65535 / mcusPerRow) * mcuEdge;
  const rowsByMemory =
    Math.floor(MAX_STRIP_BYTES / (width * CHANNELS * ROW_ALIGNMENT)) * ROW_ALIGNMENT;
  const balanced =
    Math.ceil(height / (workers * STRIPS_PER_WORKER) / ROW_ALIGNMENT) * ROW_ALIGNMENT;
  const rows = Math.max(
    mcuEdge,
    Math.min(Math.max(balanced, MIN_STRIP_ROWS), MAX_STRIP_ROWS, rowsByMemory, rowsByRestart),
  );
  const result: Strip[] = [];
  for (let y = 0; y < height; y += rows) result.push({ y, height: Math.min(rows, height - y) });
  return result;
}

const MIN_PIXELS_PER_WORKER = 2_000_000;

const MIB = 1024 * 1024;
const FALLBACK_CORES = 2;
const HIGH_END_MOBILE_CORES = 6;
const WORKER_OVERHEAD_BYTES = 16 * MIB;
const MEMORY_BUDGET_MIB = {
  perReportedGiB: 128,
  min: 512,
  max: 2048,
  highEndMobile: 768,
  mobile: 320,
  desktop: 1024,
} as const;

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Navigator {
    readonly deviceMemory?: number;
  }
}

function memoryBudgetMiB(cores: number): number {
  const reported = navigator.deviceMemory;
  if (reported) {
    return Math.min(
      MEMORY_BUDGET_MIB.max,
      Math.max(MEMORY_BUDGET_MIB.min, reported * MEMORY_BUDGET_MIB.perReportedGiB),
    );
  }
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!mobile) return MEMORY_BUDGET_MIB.desktop;
  return cores >= HIGH_END_MOBILE_CORES
    ? MEMORY_BUDGET_MIB.highEndMobile
    : MEMORY_BUDGET_MIB.mobile;
}

function workerBudget(sourceBytes: number, pixels: number): number {
  const cores = navigator.hardwareConcurrency || FALLBACK_CORES;
  const memoryBudget = memoryBudgetMiB(cores) * MIB;
  const perWorker = sourceBytes * 2 + STRIP_ALLOWANCE_BYTES + WORKER_OVERHEAD_BYTES;
  const byMemory = Math.max(1, Math.floor(memoryBudget / perWorker));
  const byWork = Math.max(1, Math.ceil(pixels / MIN_PIXELS_PER_WORKER));
  return Math.min(Math.max(1, cores - 1), byMemory, byWork);
}

type Waiting = { resolve: (bytes: ArrayBuffer) => void; reject: (error: Error) => void };
type StripWorkerOptions = {
  engine: RendererEngine;
  requestJson: string;
  pixelArena: ArrayBuffer;
  fontArena: ArrayBuffer;
  module: WebAssembly.Module;
  dpi: number;
  quality: number;
  signal?: AbortSignal;
};

class StripWorker {
  private readonly worker = new Worker(new URL("./strip.worker", import.meta.url), {
    type: "module",
  });

  private waiting: Waiting | undefined;
  private nextId = 1;
  private readonly ready: Promise<void>;

  constructor(options: StripWorkerOptions) {
    this.worker.onerror = () => this.fail(new Error("Poster strip worker could not run"));
    this.worker.onmessage = ({ data }: MessageEvent<StripResponse>) => {
      if (data.type === "error") this.fail(new Error(data.message));
      else if (data.type === "ready") this.waiting?.resolve(new ArrayBuffer(0));
      else this.waiting?.resolve(data.bytes);
      this.waiting = undefined;
    };
    options.signal?.addEventListener("abort", () => this.dispose(), { once: true });
    this.ready = this.request(() =>
      this.worker.postMessage(
        {
          type: "init",
          engine: options.engine,
          requestJson: options.requestJson,
          pixelArena: options.pixelArena,
          fontArena: options.fontArena,
          module: options.module,
          dpi: options.dpi,
          quality: options.quality,
        },
        [options.pixelArena, options.fontArena],
      ),
    ).then(() => undefined);
  }

  waitUntilReady(): Promise<void> {
    return this.ready;
  }

  async render(strip: Strip, signal?: AbortSignal): Promise<ArrayBuffer> {
    await this.ready;
    signal?.throwIfAborted();
    const id = this.nextId++;
    return this.request(() => this.worker.postMessage({ type: "render", id, ...strip }));
  }

  dispose() {
    this.fail(new DOMException("Export cancelled", "AbortError"));
  }

  private request(send: () => void): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      if (this.waiting) {
        reject(new Error("Poster strip worker is busy"));
        return;
      }
      this.waiting = { resolve, reject };
      try {
        send();
      } catch (cause) {
        this.waiting = undefined;
        reject(cause instanceof Error ? cause : new Error(String(cause)));
      }
    });
  }

  private fail(error: Error) {
    this.waiting?.reject(error);
    this.waiting = undefined;
    this.worker.terminate();
  }
}

const rendererModules: Partial<Record<RendererEngine, Promise<WebAssembly.Module>>> = {};

function compiledRendererModule(engine: RendererEngine): Promise<WebAssembly.Module> {
  rendererModules[engine] ??= fetch(WASM_URLS[engine]).then(async (response) => {
    if (!response.ok) throw new Error("Poster renderer could not be loaded");
    try {
      return await WebAssembly.compileStreaming(Promise.resolve(response.clone()));
    } catch {
      return WebAssembly.compile(await response.arrayBuffer());
    }
  });
  return rendererModules[engine];
}

export async function renderParallelJpeg(options: {
  engine: RendererEngine;
  requestJson: string;
  pixelArena: Uint8Array<ArrayBuffer>;
  fontArena: Uint8Array<ArrayBuffer>;
  width: number;
  height: number;
  dpi: number;
  quality: number;
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
}): Promise<Uint8Array> {
  const reportProgress = options.onProgress ?? noop;
  options.signal?.throwIfAborted();
  reportProgress(0.08);
  const module = await compiledRendererModule(options.engine);
  options.signal?.throwIfAborted();
  reportProgress(0.1);
  const budget = workerBudget(
    options.pixelArena.byteLength + options.fontArena.byteLength,
    options.width * options.height,
  );
  const bands = strips(options.width, options.height, options.quality, budget);
  const count = Math.min(bands.length, budget);
  const workers: StripWorker[] = [];
  const encoded: Array<{ bytes: Uint8Array; height: number }> = [];

  try {
    for (let index = 0; index < count; index++) {
      const pixelCopy = index === count - 1 ? options.pixelArena : options.pixelArena.slice();
      const fontCopy = index === count - 1 ? options.fontArena : options.fontArena.slice();
      workers.push(
        new StripWorker({
          engine: options.engine,
          requestJson: options.requestJson,
          pixelArena: pixelCopy.buffer,
          fontArena: fontCopy.buffer,
          module,
          dpi: options.dpi,
          quality: options.quality,
          signal: options.signal,
        }),
      );
    }

    await Promise.all(workers.map((worker) => worker.waitUntilReady()));
    options.signal?.throwIfAborted();
    reportProgress(0.15);

    const active = workers.map((worker, index) =>
      index < bands.length ? worker.render(bands[index], options.signal) : undefined,
    );
    for (let index = 0; index < bands.length; index++) {
      const workerIndex = index % count;
      const pending = active[workerIndex];
      if (!pending) throw new Error(`No strip pending on worker ${workerIndex}`);
      // eslint-disable-next-line no-await-in-loop
      const buffer = await pending;
      options.signal?.throwIfAborted();
      encoded.push({ bytes: new Uint8Array(buffer), height: bands[index].height });
      reportProgress(0.15 + ((index + 1) / bands.length) * 0.83);
      const next = index + count;
      active[workerIndex] =
        next < bands.length ? workers[workerIndex].render(bands[next], options.signal) : undefined;
    }
    const jpeg = spliceJpegStrips(encoded, options.dpi);
    if (!jpeg)
      throw new Error(
        `Parallel JPEG strips are incompatible: ${jpegStripCompatibilityIssue(encoded)}`,
      );
    reportProgress(1);
    return jpeg;
  } finally {
    for (const worker of workers) worker.dispose();
  }
}
