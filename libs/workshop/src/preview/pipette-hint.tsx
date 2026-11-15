import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@freetsy/ui/components/alert";
import { Button } from "@freetsy/ui/components/button";
import { cn } from "@freetsy/ui/lib/utils";

export function PipetteHint({ onCancel }: { onCancel: () => void }) {
  const { t } = useTranslation();

  return (
    <Alert>
      <AlertDescription className={cn("flex flex-wrap items-center justify-between gap-s")}>
        {t("pipette.hint")}
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t("pipette.cancel")}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
