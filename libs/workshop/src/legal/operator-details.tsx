import { Fragment } from "react";
import { cn } from "@freetsy/ui/lib/utils";
import type { SiteOperator } from "../app/site-config";
import { LEGAL_LINK } from "./legal-page";

export function OperatorAddress({ operator }: { operator: SiteOperator }) {
  return (
    <>
      {[operator.name, ...operator.address].map((line, index) => (
        <Fragment key={line}>
          {index > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  );
}

export function OperatorEmailLink({ operator }: { operator: SiteOperator }) {
  return (
    <a href={`mailto:${operator.email}`} className={cn(LEGAL_LINK)}>
      {operator.email}
    </a>
  );
}
