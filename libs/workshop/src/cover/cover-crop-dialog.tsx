import { lazy, Suspense } from "react";
import type { PosterCover } from "./use-poster-cover";

const CoverCropperModal = lazy(() =>
  import("./cover-cropper").then((module) => ({ default: module.CoverCropperModal })),
);

export function CoverCropDialog({ cover }: { cover: PosterCover }) {
  if (!cover.draftUrl) return null;
  return (
    <Suspense fallback={null}>
      <CoverCropperModal
        imageUrl={cover.draftUrl}
        aspect={cover.cropAspect}
        isProcessing={cover.isProcessing}
        onConfirm={cover.confirmCrop}
        onCancel={cover.cancelCrop}
      />
    </Suspense>
  );
}
