/* tslint:disable */
/* eslint-disable */
/**
 * The poster as straight-alpha RGBA rows, for the live preview's canvas.
 */
export function render_rgba(request_json: string, pixel_arena: Uint8Array, font_arena: Uint8Array): Uint8Array;
/**
 * The poster as JPEG bytes at the given DPI and quality.
 */
export function render_jpeg(request_json: string, pixel_arena: Uint8Array, font_arena: Uint8Array, dpi: number, quality: number): Uint8Array;
/**
 * A worker-local renderer for large exports: the scene, pixels and fonts
 * cross the boundary once, then each band is a call with four integers.
 */
export class PosterStripRenderer {
  free(): void;
  render_jpeg(y: number, height: number, dpi: number, quality: number): Uint8Array;
  constructor(request_json: string, pixel_arena: Uint8Array, font_arena: Uint8Array);
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_posterstriprenderer_free: (a: number, b: number) => void;
  readonly posterstriprenderer_new: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
  readonly posterstriprenderer_render_jpeg: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
  readonly render_jpeg: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number, number, number];
  readonly render_rgba: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
