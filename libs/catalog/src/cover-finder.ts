/* Nicominecith Poster: finds a cover image automatically (iTunes, Wikidata/Commons,
   Wikipedia, Open Library). All sources allow browser (CORS) access. */

export type CoverHint = {
  kind: "music" | "film" | "book";
  title: string;
  creator?: string;
  wikidataId?: string;
  openLibraryId?: string;
  spotifyUrl?: string;
};

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function getJson(url: string, signal?: AbortSignal): Promise<Json> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as Json;
}

const q = encodeURIComponent;

async function itunes(hint: CoverHint, signal?: AbortSignal): Promise<string[]> {
  const term = q(`${hint.creator ?? ""} ${hint.title}`.trim());
  const data = await getJson(
    `https://itunes.apple.com/search?term=${term}&entity=album&media=music&limit=3`,
    signal,
  );
  return (data.results ?? [])
    .map((r: Json) => String(r.artworkUrl100 ?? ""))
    .filter(Boolean)
    .map((u: string) => u.replace(/\d+x\d+bb/, "1400x1400bb"));
}

async function spotify(hint: CoverHint, signal?: AbortSignal): Promise<string[]> {
  if (!hint.spotifyUrl || !/open\.spotify\.com\/(intl-[a-z]+\/)?album\//.test(hint.spotifyUrl)) return [];
  const data = await getJson(`https://open.spotify.com/oembed?url=${q(hint.spotifyUrl)}`, signal);
  return typeof data.thumbnail_url === "string" ? [data.thumbnail_url] : [];
}

async function commonsFile(name: string, signal?: AbortSignal): Promise<string[]> {
  const data = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=${q(`File:${name}`)}&prop=imageinfo&iiprop=url&iiurlwidth=1400&format=json&origin=*`,
    signal,
  );
  const page = Object.values(data.query?.pages ?? {})[0] as Json | undefined;
  const info = page?.imageinfo?.[0];
  return [info?.thumburl, info?.url].filter(Boolean) as string[];
}

async function wikidataImage(id: string, signal?: AbortSignal): Promise<string[]> {
  for (const property of ["P3383", "P18"]) {
    const data = await getJson(
      `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${q(id)}&property=${property}&format=json&origin=*`,
      signal,
    );
    const file = data.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
    if (typeof file === "string") return commonsFile(file, signal);
  }
  return [];
}

async function wikipediaImage(hint: CoverHint, signal?: AbortSignal): Promise<string[]> {
  const extra = hint.kind === "film" ? "film" : hint.kind === "book" ? "novel" : "album";
  const search = q(`${hint.title} ${extra} ${hint.creator ?? ""}`.trim());
  const urls: string[] = [];
  for (const lang of ["en", "de"]) {
    const data = await getJson(
      `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${search}&gsrlimit=1&prop=pageimages&piprop=original&format=json&origin=*`,
      signal,
    ).catch(() => ({}) as Json);
    const page = Object.values(data.query?.pages ?? {})[0] as Json | undefined;
    if (page?.original?.source) urls.push(String(page.original.source));
  }
  return urls;
}

async function openLibrary(hint: CoverHint, signal?: AbortSignal): Promise<string[]> {
  const cover = (id: unknown) => `https://covers.openlibrary.org/b/id/${String(id)}-L.jpg?default=false`;
  if (hint.openLibraryId) {
    const work = await getJson(`https://openlibrary.org/works/${q(hint.openLibraryId)}.json`, signal).catch(
      () => ({}) as Json,
    );
    const first = (work.covers ?? []).find((c: number) => c > 0);
    if (first) return [cover(first)];
  }
  const data = await getJson(
    `https://openlibrary.org/search.json?title=${q(hint.title)}&author=${q(hint.creator ?? "")}&fields=cover_i&limit=3`,
    signal,
  );
  return (data.docs ?? []).filter((d: Json) => d.cover_i).map((d: Json) => cover(d.cover_i));
}

async function candidates(hint: CoverHint, signal?: AbortSignal): Promise<string[]> {
  const steps: Array<() => Promise<string[]>> =
    hint.kind === "music"
      ? [() => spotify(hint, signal), () => itunes(hint, signal), () => wikipediaImage(hint, signal)]
      : hint.kind === "film"
        ? [
            () => (hint.wikidataId ? wikidataImage(hint.wikidataId, signal) : Promise.resolve([])),
            () => wikipediaImage(hint, signal),
          ]
        : [() => openLibrary(hint, signal), () => wikipediaImage(hint, signal)];
  const urls: string[] = [];
  for (const step of steps) {
    try {
      urls.push(...(await step()));
    } catch {
      /* next source */
    }
  }
  return urls;
}

/** Returns the first image that can actually be downloaded, or null. */
export async function fetchCoverBlob(hint: CoverHint, signal?: AbortSignal): Promise<Blob | null> {
  for (const url of await candidates(hint, signal)) {
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) continue;
      const blob = await response.blob();
      if (blob.type.startsWith("image/") && blob.size > 2000) return blob;
    } catch {
      if (signal?.aborted) return null;
    }
  }
  return null;
}
