
export type ScriptFace = { 400: string; 700: string | null };

export type ScriptFamilyMap = { faces: readonly ScriptFace[]; coverage: string };

export type ScriptFamily = {
  id: string;
  outline: ReadonlyArray<readonly [number, number]>;
  load: () => Promise<ScriptFamilyMap>;
};
