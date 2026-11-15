import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { readJson, type Tree } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { workshopGenerator } from "../src/generators/workshop/generator.ts";
import { readWorkshopApps } from "../src/generators/workshop/registrations.ts";

const WORKSPACE_ROOT = path.resolve(import.meta.dirname, "../../..");

const WORKSPACE_FILES = [
  ".prettierrc.json",
  "package.json",
  "firebase.json",
  "tools/vite/workshop-app.ts",
  "apps/site/assemble.mjs",
  "apps/site/project.json",
  "libs/poster/src/listing.ts",
  "libs/workshop/src/app/workshops.ts",
];

function workspace(): Tree {
  const tree = createTreeWithEmptyWorkspace({ formatter: "none" });
  for (const file of WORKSPACE_FILES) {
    tree.write(file, readFileSync(path.join(WORKSPACE_ROOT, file), "utf8"));
  }
  return tree;
}

function read(tree: Tree, file: string): string {
  return tree.read(file, "utf8") ?? "";
}

type SiteProject = {
  implicitDependencies: string[];
  targets: { build: { dependsOn: Array<{ projects: string[] }> } };
};

type Hosting = { hosting: { rewrites: Array<{ source: string; destination: string }> } };

void test("scaffolds a catalog workshop shaped like apps/film", async () => {
  const tree = workspace();
  await workshopGenerator(tree, { name: "board-game", base: "/spiele/", port: 3010 });

  assert.deepEqual(readJson<{ tags: string[] }>(tree, "apps/board-game/project.json").tags, [
    "type:app",
    "scope:board-game",
  ]);
  assert.match(read(tree, "apps/board-game/vite.config.ts"), /workshopApp\("board-game"/);
  assert.match(read(tree, "apps/board-game/src/main.tsx"), /workshop=\{boardGameWorkshop\}/);
  const workshop = read(tree, "apps/board-game/src/board-game-workshop.tsx");
  assert.match(workshop, /createCatalog<BoardGameSummary, BoardGameDetail>/);
  assert.match(workshop, /export const boardGameWorkshop = defineCatalogWorkshop/);
  assert.ok(tree.exists("apps/board-game/index.html"));
});

void test("registers the app with vite, the site build, hosting and the dev server", async () => {
  const tree = workspace();
  await workshopGenerator(tree, { name: "game", base: "/spiele/", port: 3010 });

  assert.deepEqual(readWorkshopApps(tree).at(-1), { name: "game", base: "/spiele/", port: 3010 });
  assert.match(read(tree, "apps/site/assemble.mjs"), /game: "spiele"/);
  const site = readJson<SiteProject>(tree, "apps/site/project.json");
  assert.ok(site.implicitDependencies.includes("game"));
  assert.ok(site.targets.build.dependsOn[0]?.projects.includes("game"));
  const sources = readJson<Hosting>(tree, "firebase.json").hosting.rewrites.map(
    (rewrite) => rewrite.source,
  );
  assert.ok(sources.indexOf("/spiele{,/**}") < sources.indexOf("**"));
  const { scripts } = readJson<{ scripts: Record<string, string> }>(tree, "package.json");
  assert.match(scripts.dev ?? "", / game --parallel=\d+$/);
});

void test("defaults the base to the name and the port to the next free one", async () => {
  const tree = workspace();
  const highest = Math.max(...readWorkshopApps(tree).map((app) => app.port));
  await workshopGenerator(tree, { name: "game" });

  assert.deepEqual(readWorkshopApps(tree).at(-1), {
    name: "game",
    base: "/game/",
    port: highest + 1,
  });
});

void test("borrows an existing listing kind until the workshop has its own", async () => {
  const tree = workspace();
  await workshopGenerator(tree, { name: "game", kind: "book" });

  assert.match(read(tree, "apps/game/src/game-workshop.tsx"), /kind: "book"/);
  assert.match(read(tree, "apps/game/src/main.tsx"), /id: "book"/);
});

void test("uses its own kind once the libraries know it", async () => {
  const tree = workspace();
  tree.write(
    "libs/poster/src/listing.ts",
    read(tree, "libs/poster/src/listing.ts").replace(
      /export type ListingKind = /,
      'export type ListingKind = "game" | ',
    ),
  );
  tree.write(
    "libs/workshop/src/app/workshops.ts",
    read(tree, "libs/workshop/src/app/workshops.ts").replace(
      /\] as const;/,
      '  { id: "game", href: "/game/", label: "nav.game" },\n] as const;',
    ),
  );
  await workshopGenerator(tree, { name: "game" });

  assert.match(read(tree, "apps/game/src/game-workshop.tsx"), /kind: "game"/);
  assert.match(read(tree, "apps/game/src/main.tsx"), /id: "game"/);
});

void test("rejects names, bases and ports that are taken", async () => {
  const [existing] = readWorkshopApps(workspace());
  assert.ok(existing);
  await assert.rejects(workshopGenerator(workspace(), { name: existing.name }));
  await assert.rejects(workshopGenerator(workspace(), { name: "game", base: existing.base }));
  await assert.rejects(workshopGenerator(workspace(), { name: "game", port: existing.port }));
  await assert.rejects(workshopGenerator(workspace(), { name: "game", kind: "game" }));
});
