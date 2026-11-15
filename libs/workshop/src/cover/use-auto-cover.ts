import { useEffect, useRef } from "react";
import { fetchCoverBlob, type CoverHint } from "@freetsy/catalog";
import { coverFromBlob, placeholderCover, type UploadedCover } from "@freetsy/poster";
import type { PosterCover } from "./use-poster-cover";

/* Nicominecith Poster: fills the poster with a cover automatically.
   Shows a generated placeholder at once, then swaps in the real cover once found. */
export function useAutoCover(
  cover: PosterCover,
  hint: CoverHint | null,
  aspect: number,
  enabled: boolean,
) {
  const missing = cover.cover === null;
  const key = hint ? `${hint.kind}|${hint.title}|${hint.creator ?? ""}|${hint.spotifyUrl ?? ""}|${enabled}` : "";
  const fetchedKey = useRef("");
  const apply = cover.applyAuto;

  useEffect(() => {
    const wantFetch = Boolean(hint && enabled && key !== fetchedKey.current);
    if (!missing && !wantFetch) return;
    const controller = new AbortController();
    const keep = (next: UploadedCover | null) => {
      if (!next) return;
      if (controller.signal.aborted) URL.revokeObjectURL(next.objectUrl);
      else apply(next);
    };
    void (async () => {
      let found: UploadedCover | null = null;
      if (wantFetch && hint) {
        fetchedKey.current = key;
        const blob = await fetchCoverBlob(hint, controller.signal);
        if (blob) (await coverFromBlob(blob, aspect)).match((c) => (found = c), () => undefined);
      }
      if (!found && missing && !controller.signal.aborted) {
        (await placeholderCover(aspect, hint?.title ?? "NP")).match((c) => (found = c), () => undefined);
      }
      keep(found);
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, missing, aspect, apply]);
}
