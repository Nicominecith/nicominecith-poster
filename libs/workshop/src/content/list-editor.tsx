import { useTranslation } from "react-i18next";
import { newListRow, type ListKind, type ListRow } from "@freetsy/poster";
import { Input } from "@freetsy/ui/components/input";
import { cn } from "@freetsy/ui/lib/utils";
import { EmphasizedInput } from "./emphasized-input";
import { SortableRows } from "./sortable-rows";

export function ListEditor({
  kind,
  rows,
  onChange,
}: {
  kind: ListKind;
  rows: ListRow[];
  onChange: (next: ListRow[]) => void;
}) {
  const { t } = useTranslation();
  const item = (number: number) => t(`lists.${kind}.item`, { number });

  return (
    <SortableRows
      rows={rows}
      onChange={onChange}
      createRow={() => newListRow()}
      addLabel={t(`lists.${kind}.add`)}
      labels={(number) => ({
        reorder: t("lists.reorder", { item: item(number) }),
        remove: t("lists.remove", { item: item(number) }),
      })}
      renderRow={({ row, number, update }) => (
        <div className={cn("flex min-w-0 flex-1 flex-col gap-xs")}>
          <EmphasizedInput
            value={row.name}
            onChange={(event) => update({ ...row, name: event.target.value })}
            placeholder={t(`lists.${kind}.namePlaceholder`)}
            aria-label={t("lists.nameAria", { item: item(number) })}
            emphasized={row.emphasized ?? false}
            onEmphasizedChange={(emphasized) => update({ ...row, emphasized })}
            emphasizeLabel={t("lists.emphasize", { item: item(number) })}
          />
          <Input
            type="text"
            value={row.detail}
            onChange={(event) => update({ ...row, detail: event.target.value })}
            placeholder={t(`lists.${kind}.detailPlaceholder`)}
            aria-label={t("lists.detailAria", { item: item(number) })}
            className={cn("min-w-0 text-secondary")}
          />
        </div>
      )}
    />
  );
}
