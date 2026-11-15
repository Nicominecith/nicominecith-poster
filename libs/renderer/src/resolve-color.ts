let probe: HTMLDivElement | null = null;

function computedVar(name: string): string {
  probe ??= document.body.appendChild(document.createElement("div"));
  probe.style.color = `var(${name})`;
  return getComputedStyle(probe).color;
}

const VAR_PATTERN = /^var\((--[\w-]+)\)$/;

function resolveVarChain(value: string): string {
  let current = value.trim();
  for (let i = 0; i < 5; i++) {
    const match = VAR_PATTERN.exec(current);
    if (!match) return current;
    current = computedVar(match[1]);
  }
  return current;
}

let canvas: HTMLCanvasElement | null = null;
let context: CanvasRenderingContext2D | null = null;

export type RgbaColor = { r: number; g: number; b: number; a: number };

export function resolveCssColor(value: string): RgbaColor {
  canvas ??= document.createElement("canvas");
  context ??= canvas.getContext("2d");
  const ctx = context;
  if (!ctx) return { r: 0, g: 0, b: 0, a: 1 };
  ctx.fillStyle = "#000000";
  ctx.fillStyle = resolveVarChain(value);
  const normalized = ctx.fillStyle;
  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    const long = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
    return {
      r: Number.parseInt(long.slice(0, 2), 16),
      g: Number.parseInt(long.slice(2, 4), 16),
      b: Number.parseInt(long.slice(4, 6), 16),
      a: 1,
    };
  }
  const match = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(normalized);
  if (!match) return { r: 0, g: 0, b: 0, a: 1 };
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] === undefined ? 1 : Number(match[4]),
  };
}
