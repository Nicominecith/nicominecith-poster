import { useAppForm } from "@freetsy/ui/form";
import { type PosterKind, POSTER_FORM_DEFAULTS, type PosterFormValues } from "@freetsy/poster";

const START_FORMAT = { music: "tracklist", film: "cast", book: "chapters" } as const;

function defaultsFor(kind: PosterKind): PosterFormValues {
  if (kind === "music") return POSTER_FORM_DEFAULTS;
  return {
    ...POSTER_FORM_DEFAULTS,
    titleAlign: "center",
    content: { ...POSTER_FORM_DEFAULTS.content, format: START_FORMAT[kind] },
  };
}

export function usePosterForm(kind: PosterKind = "music") {
  return useAppForm({ defaultValues: defaultsFor(kind) });
}

export type PosterFormApi = ReturnType<typeof usePosterForm>;
