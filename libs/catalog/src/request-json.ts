import { ResultAsync } from "neverthrow";
import { parse, type ZodMiniType } from "zod/mini";
import { toError } from "@freetsy/utils";

const REQUEST_TIMEOUT_MS = 15_000;

export function requestJson<T>({
  url,
  schema,
  signal,
  errorMessage,
  timeoutMs = REQUEST_TIMEOUT_MS,
}: {
  url: URL;
  schema: ZodMiniType<T>;
  signal?: AbortSignal;
  errorMessage: string;
  timeoutMs?: number;
}): ResultAsync<T, Error> {
  return ResultAsync.fromPromise(
    (async () => {
      const controller = new AbortController();
      const abort = () => controller.abort(signal?.reason);
      if (signal?.aborted) abort();
      else signal?.addEventListener("abort", abort, { once: true });
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error(`${errorMessage} (HTTP ${response.status})`);
        return parse(schema, await response.json());
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", abort);
      }
    })(),
    (cause) => toError(cause, errorMessage),
  );
}
