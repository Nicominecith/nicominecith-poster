import type { AlbumContent, ContentTrack, ListKind } from "./album/content";

export type TrackRow = ContentTrack & { id: string };

export type ListEntry = {
  name: string;
  detail: string;
  emphasized?: boolean;
};

export type ListRow = ListEntry & { id: string };

type ContentLists = Record<ListKind, ListRow[]>;

export type InfoCredit = { label: string; value: string };

export type InfoRow = InfoCredit & { id: string };

export type EditableContent = Omit<AlbumContent, "tracks"> & {
  tracks: TrackRow[];
  lists: ContentLists;
  quote: string;
  runtime: string;
  pages: string;
  credits: InfoRow[];
  creditOptions: InfoCredit[];
  textSource: string;
};

let nextRowId = 0;

export function newTrackRow(
  track: ContentTrack = { title: "", duration: "", emphasized: false },
): TrackRow {
  nextRowId += 1;
  return { ...track, id: `track-${nextRowId}` };
}

export function newListRow(
  entry: ListEntry = { name: "", detail: "", emphasized: false },
): ListRow {
  nextRowId += 1;
  return { ...entry, id: `row-${nextRowId}` };
}

export function newInfoRow(credit: InfoCredit = { label: "", value: "" }): InfoRow {
  nextRowId += 1;
  return { ...credit, id: `info-${nextRowId}` };
}

export function emptyLists(): ContentLists {
  return { cast: [], awards: [], chapters: [], characters: [], works: [] };
}

export function editableContent(
  content: AlbumContent,
): Omit<
  EditableContent,
  "lists" | "quote" | "runtime" | "pages" | "credits" | "creditOptions" | "textSource"
> {
  return { ...content, tracks: content.tracks.map(newTrackRow) };
}
