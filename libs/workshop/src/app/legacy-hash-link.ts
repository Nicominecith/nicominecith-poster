export function followLegacyHashLink(): boolean {
  const { hash, origin } = window.location;
  if (!hash.startsWith("#/")) return false;
  window.location.replace(new URL(hash.slice(1), origin));
  return true;
}
