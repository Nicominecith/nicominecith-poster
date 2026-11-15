import { useTranslation } from "react-i18next";
import { isValidDuration, newTrackRow, type TrackRow } from "@freetsy/poster";
import { FieldError } from "@freetsy/ui/components/field";
import { Input } from "@freetsy/ui/components/input";
import { cn } from "@freetsy/ui/lib/utils";
import { EmphasizedInput, SortableRows, type SortableRowRender } from "@freetsy/workshop";

const hasInvalidDuration = (row: TrackRow) =>
  Boolean(row.title.trim()) && !isValidDuration(row.duration);

function TrackFields({ row, number, update }: SortableRowRender<TrackRow>) {
  const { t } = useTranslation();
  const errorId = `track-${row.id}-duration`;
  const invalid = hasInvalidDuration(row);

  return (
    <>
      <EmphasizedInput
        value={row.title}
        onChange={(event) => update({ ...row, title: event.target.value })}
        placeholder={t("settings.trackTitlePlaceholder")}
        aria-label={t("settings.trackTitleAria", { number })}
        emphasized={row.emphasized ?? false}
        onEmphasizedChange={(emphasized) => update({ ...row, emphasized })}
        emphasizeLabel={t("settings.trackEmphasize", { number })}
      />
      <Input
        type="text"
        value={row.duration}
        onChange={(event) => update({ ...row, duration: event.target.value })}
        placeholder={t("settings.trackDurationPlaceholder")}
        aria-label={t("settings.trackDurationAria", { number })}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        className={cn("w-16 shrink-0 px-s text-center")}
      />
    </>
  );
}

function TrackError({ row }: SortableRowRender<TrackRow>) {
  const { t } = useTranslation();
  return (
    <FieldError id={`track-${row.id}-duration`}>
      {hasInvalidDuration(row) ? t("validation.duration") : undefined}
    </FieldError>
  );
}

export function TracklistEditor({
  tracks,
  onChange,
}: {
  tracks: TrackRow[];
  onChange: (next: TrackRow[]) => void;
}) {
  const { t } = useTranslation();

  return (
    <SortableRows
      rows={tracks}
      onChange={onChange}
      createRow={() => newTrackRow()}
      addLabel={t("settings.trackAdd")}
      labels={(number) => ({
        reorder: t("settings.trackReorder", { number }),
        remove: t("settings.trackRemove", { number }),
      })}
      renderRow={(render) => <TrackFields {...render} />}
      renderFooter={(render) => <TrackError {...render} />}
    />
  );
}
