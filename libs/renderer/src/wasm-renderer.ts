import type { RenderRequest, RenderResponse } from "./render.worker";
import type { RendererEngine } from "./renderer-engine";

type FontSlice = { offset: number; length: number };

export function buildFontArena(fonts: Map<string, ArrayBuffer>): {
  arena: Uint8Array<ArrayBuffer>;
  directory: Record<string, FontSlice>;
} {
  const total = [...fonts.values()].reduce((sum, buffer) => sum + buffer.byteLength, 0);
  const arena = new Uint8Array(total);
  const directory: Record<string, FontSlice> = {};
  let offset = 0;
  for (const [name, buffer] of fonts) {
    arena.set(new Uint8Array(buffer), offset);
    directory[name] = { offset, length: buffer.byteLength };
    offset += buffer.byteLength;
  }
  return { arena, directory };
}

let nextId = 1;
type PendingRender = {
  resolve: (bytes: Uint8Array) => void;
  reject: (error: Error) => void;
  removeAbortListener: () => void;
};
type WorkerLane = {
  worker: Worker | null;
  pending: Map<number, PendingRender>;
};

const lanes: Record<PosterRenderLane, WorkerLane> = {
  preview: { worker: null, pending: new Map() },
  export: { worker: null, pending: new Map() },
};

function renderWorker(lane: PosterRenderLane): Worker {
  const slot = lanes[lane];
  if (slot.worker) return slot.worker;
  const created = new Worker(new URL("./render.worker", import.meta.url), { type: "module" });
  created.onmessage = ({ data }: MessageEvent<RenderResponse>) => {
    const waiting = slot.pending.get(data.id);
    if (!waiting) return;
    slot.pending.delete(data.id);
    waiting.removeAbortListener();
    if (data.type === "done") waiting.resolve(new Uint8Array(data.bytes));
    else waiting.reject(new Error(data.message));
    if (lane === "export" && slot.pending.size === 0) {
      created.terminate();
      slot.worker = null;
    }
  };
  created.onerror = () => {
    failLane(lane, new Error("Poster renderer could not run"));
  };
  slot.worker = created;
  return created;
}

function failLane(lane: PosterRenderLane, error: Error) {
  const slot = lanes[lane];
  for (const waiting of slot.pending.values()) {
    waiting.removeAbortListener();
    waiting.reject(error);
  }
  slot.pending.clear();
  slot.worker?.terminate();
  slot.worker = null;
}

type PosterRenderOutput = { kind: "rgba" } | { kind: "jpeg"; dpi: number; quality: number };

type PosterRenderLane = "preview" | "export";

type PosterRenderJob = {
  engine: RendererEngine;
  requestJson: string;
  pixelArena: Uint8Array<ArrayBuffer>;
  fontArena: Uint8Array<ArrayBuffer>;
  output: PosterRenderOutput;
  lane: PosterRenderLane;
  signal?: AbortSignal;
};

export function renderInWorker(job: PosterRenderJob): Promise<Uint8Array> {
  const { engine, requestJson, pixelArena, fontArena, output, lane, signal } = job;
  return new Promise<Uint8Array>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Export cancelled", "AbortError"));
      return;
    }
    if (lane === "export" && lanes.preview.pending.size === 0 && lanes.preview.worker) {
      lanes.preview.worker.terminate();
      lanes.preview.worker = null;
    }
    const id = nextId++;
    const abort = () => {
      if (!lanes[lane].pending.has(id)) return;
      failLane(lane, new DOMException("Render cancelled", "AbortError"));
    };
    const removeAbortListener = () => signal?.removeEventListener("abort", abort);
    lanes[lane].pending.set(id, { resolve, reject, removeAbortListener });
    signal?.addEventListener("abort", abort, { once: true });

    const message: RenderRequest = {
      id,
      engine,
      requestJson,
      pixelArena: pixelArena.buffer,
      fontArena: fontArena.buffer,
      output,
    };
    try {
      renderWorker(lane).postMessage(message, [message.pixelArena, message.fontArena]);
    } catch (cause) {
      lanes[lane].pending.delete(id);
      removeAbortListener();
      reject(cause instanceof Error ? cause : new Error(String(cause)));
    }
  });
}
