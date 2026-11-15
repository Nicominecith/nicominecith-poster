import { test } from "node:test";
import assert from "node:assert/strict";
import { NO_SCRIPT_FACES, resolveScriptFaces } from "@freetsy/fonts";
import { rendererEngine } from "../src/renderer-engine";

void test("a Latin poster runs the Latin engine", () => {
  assert.equal(rendererEngine(NO_SCRIPT_FACES), "latin");
});

void test("a poster with a script face runs the shaping engine", async () => {
  assert.equal(rendererEngine(await resolveScriptFaces(["अहंकार Freestyle"])), "scripts");
});
