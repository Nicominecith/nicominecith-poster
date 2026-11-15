import { useTranslation } from "react-i18next";
import { PosterWorkbench, usePosterForm } from "@freetsy/workshop";
import { PosterContentFields } from "./poster-content-fields";
import { usePosterAlbum } from "./use-poster-album";

export function PosterCreator() {
  const { t } = useTranslation();
  const form = usePosterForm("music");
  const album = usePosterAlbum(form);
  const detail = album.query.data;

  return (
    <PosterWorkbench
      kind="music"
      form={form}
      importing={album.isLoading}
      onCancelImport={album.cancel}
      cancelImportLabel={t("validation.cancelAlbum")}
      coverHint={detail ? { kind: "music", title: detail.name, creator: detail.artist } : null}
      contentFields={<PosterContentFields form={form} album={album} />}
    />
  );
}
