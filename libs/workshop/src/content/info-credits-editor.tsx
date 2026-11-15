import { useTranslation } from "react-i18next";
import { PlusIcon } from "lucide-react";
import { newInfoRow, type InfoCredit, type InfoRow } from "@freetsy/poster";
import { Button } from "@freetsy/ui/components/button";
import { Input } from "@freetsy/ui/components/input";
import { cn } from "@freetsy/ui/lib/utils";
import { SortableRows } from "./sortable-rows";

const labelKey = (label: string) => label.trim().toLowerCase();

function SuggestionChips({
  title,
  suggestions,
  onPick,
}: {
  title: string;
  suggestions: readonly InfoCredit[];
  onPick: (suggestion: InfoCredit) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-s")}>
      <span className={cn("font-mono-ui text-2xs tracking-ui text-secondary uppercase")}>
        {title}
      </span>
      <div className={cn("flex flex-wrap gap-s")}>
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion.label}
            variant="outline"
            size="sm"
            title={suggestion.value || undefined}
            onClick={() => onPick(suggestion)}
          >
            <PlusIcon strokeWidth="var(--stroke-icon)" />
            {suggestion.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function InfoCreditsEditor({
  credits,
  onChange,
  options = [],
  suggestions = [],
}: {
  credits: InfoRow[];
  onChange: (next: InfoRow[]) => void;
  options?: readonly InfoCredit[];
  suggestions?: readonly InfoCredit[];
}) {
  const { t } = useTranslation();
  const taken = new Set(credits.map((credit) => labelKey(credit.label)));
  const sourceLabels = new Set(options.map((option) => labelKey(option.label)));
  const isFree = (credit: InfoCredit) => !taken.has(labelKey(credit.label));
  const fromSource = options.filter((option) => option.value.trim() && isFree(option));
  const personal = suggestions.filter(
    (suggestion) => isFree(suggestion) && !sourceLabels.has(labelKey(suggestion.label)),
  );
  const add = (credit: InfoCredit) => onChange([...credits, newInfoRow(credit)]);

  return (
    <SortableRows
      rows={credits}
      onChange={onChange}
      createRow={() => newInfoRow()}
      addLabel={t("infos.add")}
      labels={(number) => ({
        reorder: t("infos.reorder", { number }),
        remove: t("infos.remove", { number }),
      })}
      renderRow={({ row, number, update }) => (
        <div className={cn("flex min-w-0 flex-1 flex-col gap-xs")}>
          <Input
            type="text"
            value={row.label}
            onChange={(event) => update({ ...row, label: event.target.value })}
            placeholder={t("infos.labelPlaceholder")}
            aria-label={t("infos.labelAria", { number })}
            className={cn("min-w-0 font-bold uppercase")}
          />
          <Input
            type="text"
            value={row.value}
            onChange={(event) => update({ ...row, value: event.target.value })}
            placeholder={t("infos.valuePlaceholder")}
            aria-label={t("infos.valueAria", { number })}
            className={cn("min-w-0")}
          />
        </div>
      )}
    >
      {(fromSource.length > 0 || personal.length > 0) && (
        <div className={cn("flex flex-col gap-m pt-s")}>
          <SuggestionChips title={t("infos.fromSource")} suggestions={fromSource} onPick={add} />
          <SuggestionChips title={t("infos.suggestions")} suggestions={personal} onPick={add} />
        </div>
      )}
    </SortableRows>
  );
}
