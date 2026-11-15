import { useCallback, useEffect, useRef, useState } from "react";
import { cropCoverImage, readCoverFile, type UploadedCover, type PixelCrop } from "@freetsy/poster";

export function usePosterCover(defaultAspect: number) {
  const [draftUrl, setDraftUrl] = useState<string | null>(null);
  const [cropAspect, setCropAspect] = useState(defaultAspect);
  const [cover, setCover] = useState<UploadedCover | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const source = useRef<string | null>(null);
  const userChosen = useRef(false);
  const applyAuto = useCallback((next: UploadedCover) => {
    if (userChosen.current) {
      URL.revokeObjectURL(next.objectUrl);
      return;
    }
    setCover(next);
  }, []);
  useEffect(
    () => () => {
      if (cover) URL.revokeObjectURL(cover.objectUrl);
    },
    [cover],
  );
  useEffect(
    () => () => {
      if (draftUrl) URL.revokeObjectURL(draftUrl);
      if (source.current === draftUrl) source.current = null;
    },
    [draftUrl],
  );
  function upload(file: File) {
    setFailure(null);
    readCoverFile(file).match(
      (url) => {
        source.current = url;
        setDraftUrl(url);
      },
      (error) => setFailure(error.message),
    );
  }
  function confirmCrop(crop: PixelCrop) {
    if (!draftUrl) return;
    const croppedFrom = draftUrl;
    setIsProcessing(true);
    void cropCoverImage(croppedFrom, crop).match(
      (cropped) => {
        if (source.current !== croppedFrom) {
          URL.revokeObjectURL(cropped.objectUrl);
          return;
        }
        userChosen.current = true;
        setCover(cropped);
        setDraftUrl(null);
        setIsProcessing(false);
      },
      (error) => {
        if (source.current !== croppedFrom) return;
        setFailure(error.message);
        setIsProcessing(false);
      },
    );
  }
  function cancelCrop() {
    source.current = null;
    setDraftUrl(null);
    setIsProcessing(false);
    if (cover) setCropAspect(cover.aspect);
  }
  function recrop(aspect: number) {
    if (!cover) {
      setCropAspect(aspect);
      return;
    }
    const url = URL.createObjectURL(cover.original.blob);
    source.current = url;
    setCropAspect(aspect);
    setDraftUrl(url);
  }
  function remove() {
    userChosen.current = false;
    setCover(null);
    setFailure(null);
  }
  return {
    draftUrl,
    cropAspect,
    recrop,
    cover,
    failure,
    isProcessing,
    upload,
    applyAuto,
    confirmCrop,
    cancelCrop,
    remove,
  };
}
export type PosterCover = ReturnType<typeof usePosterCover>;
