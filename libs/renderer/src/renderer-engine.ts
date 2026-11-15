import type { ScriptFaces } from "@freetsy/fonts";

export type RendererEngine = "latin" | "scripts";

export function rendererEngine(scriptFaces: ScriptFaces): RendererEngine {
  return scriptFaces[400].length > 0 ? "scripts" : "latin";
}
