import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { requestJson } from "../src/request-json";

void test("caller cancellation reaches the provider request", async () => {
  const controller = new AbortController();
  let receivedSignal: AbortSignal | null | undefined;
  const fetchMock = mock.method(globalThis, "fetch", (_url: URL, init: RequestInit) => {
    receivedSignal = init.signal;
    return new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    });
  });
  try {
    const result = requestJson({
      url: new URL("https://example.com/album"),
      schema: z.object({ id: z.string() }),
      signal: controller.signal,
      errorMessage: "Request failed",
    });
    controller.abort();
    assert.equal((await result).isErr(), true);
    assert.equal(receivedSignal?.aborted, true);
  } finally {
    fetchMock.mock.restore();
  }
});

void test("deadline also aborts a stalled JSON response body", async () => {
  const fetchMock = mock.method(globalThis, "fetch", (_url: URL, init: RequestInit) =>
    Promise.resolve(
      new Response(
        new ReadableStream({
          start(controller) {
            init.signal?.addEventListener("abort", () => controller.error(new Error("timed out")), {
              once: true,
            });
          },
        }),
      ),
    ),
  );
  try {
    const result = await requestJson({
      url: new URL("https://example.com/album"),
      schema: z.object({ id: z.string() }),
      errorMessage: "Request failed",
      timeoutMs: 10,
    });
    assert.equal(result.isErr(), true);
  } finally {
    fetchMock.mock.restore();
  }
});
