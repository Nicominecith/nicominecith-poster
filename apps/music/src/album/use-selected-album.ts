import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { albumQueries } from "./queries";
import { useAlbumEditions } from "./use-album-editions";
import { type AlbumDetail } from "@freetsy/poster";
import { type AlbumRef } from "./types";

export function useSelectedAlbum(onLoad: (album: AlbumDetail) => void) {
  const queryClient = useQueryClient();
  const [album, setAlbum] = useState<AlbumRef | null>(null);
  const editions = useAlbumEditions(album);
  const { chosenReleaseId, needsChoice, isPending } = editions;

  const detail = albumQueries.detail(album, chosenReleaseId);
  const query = useQuery({ ...detail, enabled: album !== null && !isPending && !needsChoice });

  const pick = album ? `${album.source}:${album.id}:${chosenReleaseId ?? ""}` : "";
  const [filledFrom, setFilledFrom] = useState("");
  const { data } = query;

  useEffect(() => {
    if (!pick || !data || isPending || needsChoice || filledFrom === pick) return;
    setFilledFrom(pick);
    onLoad(data);
  }, [pick, data, filledFrom, onLoad, isPending, needsChoice]);

  return {
    album,
    query,
    editions,
    isLoading: Boolean(album) && filledFrom !== pick && !query.isError,
    cancel() {
      void queryClient.cancelQueries({ queryKey: detail.queryKey });
      void queryClient.cancelQueries({ queryKey: albumQueries.editions(album).queryKey });
      setAlbum(null);
      setFilledFrom("");
      editions.reset();
    },
    select(next: AlbumRef | null) {
      setFilledFrom("");
      setAlbum(next);
      editions.reset();
    },
  };
}
