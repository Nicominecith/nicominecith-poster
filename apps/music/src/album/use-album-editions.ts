import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { albumQueries } from "./queries";
import { type AlbumRef } from "./types";

export function useAlbumEditions(album: AlbumRef | null) {
  const [chosenReleaseId, setChosenReleaseId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const query = useQuery(albumQueries.editions(album));

  const editions = query.data ?? [];
  const needsChoice = editions.length > 1 && chosenReleaseId === null;

  return {
    editions,
    chosenReleaseId,
    needsChoice,
    isPending: query.isPending,
    reset() {
      setChosenReleaseId(null);
      setIsDialogOpen(false);
    },
    openDialog() {
      setIsDialogOpen(true);
    },
    dialogProps: {
      open: needsChoice || isDialogOpen,
      chosenReleaseId,
      onChoose(releaseId: string) {
        setChosenReleaseId(releaseId);
        setIsDialogOpen(false);
      },
      onDismiss() {
        if (chosenReleaseId === null && editions.length > 0) {
          setChosenReleaseId(editions[0].releaseId);
        }
        setIsDialogOpen(false);
      },
    },
  };
}
