import { test } from "node:test";
import assert from "node:assert/strict";
import { readJson } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { libraryGenerator } from "../src/generators/library/generator.ts";

type TsConfig = { compilerOptions: { paths: Record<string, string[]> } };

void test("scaffolds a tagged library and exposes it under @freetsy/<name>", async () => {
  const tree = createTreeWithEmptyWorkspace({ formatter: "none" });
  await libraryGenerator(tree, { name: "colors" });

  assert.deepEqual(readJson<{ tags: string[] }>(tree, "libs/colors/project.json").tags, [
    "type:lib",
  ]);
  assert.ok(tree.exists("libs/colors/src/index.ts"));
  assert.deepEqual(
    readJson<TsConfig>(tree, "tsconfig.base.json").compilerOptions.paths["@freetsy/colors"],
    ["./libs/colors/src/index.ts"],
  );
});

void test("refuses to overwrite an existing library", async () => {
  const tree = createTreeWithEmptyWorkspace({ formatter: "none" });
  await libraryGenerator(tree, { name: "colors" });
  await assert.rejects(libraryGenerator(tree, { name: "colors" }));
});
