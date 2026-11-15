import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { RotateCcwIcon, SearchIcon } from "lucide-react";
import { cn } from "@freetsy/ui/lib/utils";
import { Alert, AlertDescription } from "@freetsy/ui/components/alert";
import { Button } from "@freetsy/ui/components/button";
import { Field, FieldDescription } from "@freetsy/ui/components/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@freetsy/ui/components/item";
import { Spinner } from "@freetsy/ui/components/spinner";

export function SourceLink({ href, children }: { href: string; children?: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn("underline hover:text-primary")}>
      {children}
    </a>
  );
}

export const CC_BY_SA_URL = "https://creativecommons.org/licenses/by-sa/4.0/";

export function SelectedEntryCard({
  query,
  summary,
  copy,
  sources,
  renderSearch,
  onReset,
}: {
  query: UseQueryResult;
  summary: { title: string; facts: string } | null;
  copy: { loading: string; loadFailed: string; chooseOther: string; reset: string; hint: string };
  sources?: ReactNode;
  renderSearch: (trigger: ReactNode) => ReactNode;
  onReset: () => void;
}) {
  const linkButton = cn("w-full items-start justify-start p-0 text-left whitespace-normal");

  return (
    <Field>
      <Item variant="outline" size="sm" className={cn("items-start")}>
        <ItemContent>
          {query.isLoading && (
            <ItemDescription className={cn("flex items-center gap-s")}>
              <Spinner className={cn("size-3.5")} />
              {copy.loading}
            </ItemDescription>
          )}
          {query.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {query.error instanceof Error ? query.error.message : copy.loadFailed}
              </AlertDescription>
            </Alert>
          )}
          {summary && (
            <>
              <ItemTitle>{summary.title}</ItemTitle>
              {summary.facts && <ItemDescription>{summary.facts}</ItemDescription>}
            </>
          )}
        </ItemContent>
        <ItemActions className={cn("w-full flex-col items-stretch gap-xs")}>
          {renderSearch(
            <Button variant="link" size="sm" className={linkButton}>
              <SearchIcon strokeWidth="var(--stroke-icon)" />
              {copy.chooseOther}
            </Button>,
          )}
          <Button variant="link" size="sm" onClick={onReset} className={linkButton}>
            <RotateCcwIcon strokeWidth="var(--stroke-icon)" />
            {copy.reset}
          </Button>
        </ItemActions>
      </Item>
      <FieldDescription>{copy.hint}</FieldDescription>
      {sources && <FieldDescription>{sources}</FieldDescription>}
    </Field>
  );
}
