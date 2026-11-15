export const WORKSHOPS = [
  { id: "music", href: "/", label: "nav.music" },
  { id: "film", href: "/film/", label: "nav.film" },
  { id: "book", href: "/buch/", label: "nav.book" },
] as const;

export type WorkshopId = (typeof WORKSHOPS)[number]["id"];
