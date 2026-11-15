const LINKABLE_TYPES = ["album", "track", "artist", "playlist", "show", "episode"] as const;

type LinkableType = (typeof LINKABLE_TYPES)[number];

const ID_PATTERN = /^[A-Za-z0-9]{22}$/;

const LOCALE_SEGMENT = /^intl-[a-z]{2}$/;

const WEB_HOSTS = new Set(["open.spotify.com", "play.spotify.com"]);

function isLinkableType(value: string | undefined): value is LinkableType {
  return LINKABLE_TYPES.some((type) => type === value);
}

function toUri(type: string | undefined, id: string | undefined): string | null {
  if (!isLinkableType(type) || !id || !ID_PATTERN.test(id)) return null;
  return `spotify:${type}:${id}`;
}

function fromUri(value: string): string | null {
  const [scheme, type, id, ...rest] = value.split(":");
  if (scheme !== "spotify" || rest.length > 0) return null;
  return toUri(type, id);
}

function fromWebUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!WEB_HOSTS.has(url.hostname)) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  if (isLocale(segments[0])) segments.shift();
  return toUri(segments[0], segments[1]);
}

function isLocale(segment: string | undefined): boolean {
  return segment !== undefined && LOCALE_SEGMENT.test(segment);
}

export function parseSpotifyLink(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("spotify:") ? fromUri(trimmed) : fromWebUrl(trimmed);
}
