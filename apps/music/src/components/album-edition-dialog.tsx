import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { type AlbumEdition, type SearchableSource } from "../album/types";
import { albumTextInfo } from "@freetsy/poster";
import { albumQueries } from "../album/queries";
import { cn } from "@freetsy/ui/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@freetsy/ui/components/accordion";
import { Alert, AlertDescription } from "@freetsy/ui/components/alert";
import { Button } from "@freetsy/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@freetsy/ui/components/dialog";
import { Spinner } from "@freetsy/ui/components/spinner";

function EditionTracks({
  albumId,
  source,
  edition,
}: {
  albumId: string;
  source: SearchableSource;
  edition: AlbumEdition;
}) {
  const { t } = useTranslation();
  const query = useQuery(albumQueries.detail({ id: albumId, source }, edition.releaseId));

  if (query.isPending) {
    return (
      <p className={cn("flex items-center gap-s text-xs text-secondary")}>
        <Spinner className={cn("size-3.5")} />
        {t("search.loading")}
      </p>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {query.error instanceof Error ? query.error.message : t("search.loadFailed")}
        </AlertDescription>
      </Alert>
    );
  }

  const tracks = albumTextInfo(query.data).columns.flat();

  return (
    <ol className={cn("flex flex-col gap-xs")}>
      {tracks.map((track) => (
        <li key={track.number} className={cn("flex items-baseline gap-s text-xs")}>
          <span className={cn("w-6 shrink-0 text-right font-mono-ui text-2xs text-secondary")}>
            {track.numberLabel}
          </span>
          <span className={cn("min-w-0 flex-1 wrap-break-word text-primary")}>{track.name}</span>
          <span className={cn("shrink-0 font-mono-ui text-2xs text-secondary")}>
            {track.durationLabel}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function AlbumEditionDialog({
  albumId,
  source,
  editions,
  open,
  chosenReleaseId,
  onChoose,
  onDismiss,
  onCancel,
}: {
  albumId: string;
  source: SearchableSource;
  editions: AlbumEdition[];
  open: boolean;
  chosenReleaseId: string | null;
  onChoose: (releaseId: string) => void;
  onDismiss: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [openEdition, setOpenEdition] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
    >
      <DialogContent size="full">
        <DialogHeader>
          <DialogTitle>{t("search.editionTitle")}</DialogTitle>
          <DialogDescription>{t("search.editionDescription")}</DialogDescription>
        </DialogHeader>

        <Accordion
          type="single"
          collapsible
          value={openEdition}
          onValueChange={setOpenEdition}
          className={cn("flex flex-col gap-s")}
        >
          {editions.map((edition) => {
            const isChosen = edition.releaseId === chosenReleaseId;
            const year = edition.releaseDate.slice(0, 4) || t("search.editionUnknownDate");
            const meta = [year, edition.format].filter(Boolean).join(" · ");

            return (
              <AccordionItem
                key={edition.releaseId}
                value={edition.releaseId}
                className={cn(isChosen && "border-primary bg-primary-soft")}
              >
                <AccordionTrigger>
                  <span className={cn("flex flex-1 flex-wrap items-baseline gap-x-m gap-y-xs")}>
                    <span className={cn("font-mono-ui text-sm text-primary")}>
                      {t("search.trackCount", { count: edition.trackCount })}
                    </span>
                    <span
                      className={cn("font-mono-ui text-2xs tracking-ui text-secondary uppercase")}
                    >
                      {meta}
                    </span>
                  </span>
                </AccordionTrigger>

                <AccordionContent className={cn("flex flex-col gap-m")}>
                  <div className={cn("max-h-56 overflow-y-auto")}>
                    {openEdition === edition.releaseId && (
                      <EditionTracks albumId={albumId} source={source} edition={edition} />
                    )}
                  </div>
                  <Button
                    size="sm"
                    className={cn("min-h-11 w-full")}
                    onClick={() => onChoose(edition.releaseId)}
                  >
                    {isChosen ? t("search.editionInUse") : t("search.editionUse")}
                  </Button>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        <Button variant="outline" onClick={onCancel}>
          {t("validation.cancelAlbum")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
