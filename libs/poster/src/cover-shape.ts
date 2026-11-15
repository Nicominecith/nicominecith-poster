import type { PosterKind } from "./kind";

export const COVER_SHAPES = [
  { id: "square", aspect: 1 },
  { id: "portrait", aspect: 2 / 3 },
] as const;

export type CoverShapeId = (typeof COVER_SHAPES)[number]["id"];

export function defaultCoverAspect(kind: PosterKind): number {
  return kind === "music" ? 1 : 2 / 3;
}

export function coverShapeOf(aspect: number): CoverShapeId {
  return COVER_SHAPES.reduce((best, shape) =>
    Math.abs(shape.aspect - aspect) < Math.abs(best.aspect - aspect) ? shape : best,
  ).id;
}

export function coverShapeAspect(id: CoverShapeId): number {
  return COVER_SHAPES.find((shape) => shape.id === id)?.aspect ?? 1;
}
