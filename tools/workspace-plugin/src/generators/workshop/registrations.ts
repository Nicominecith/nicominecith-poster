import { logger, updateJson, type Tree } from "@nx/devkit";
import type ts from "typescript";
import {
  append,
  arrayLiteral,
  elements,
  entries,
  insertInto,
  jsonRoot,
  numberValue,
  objectKey,
  objectLiteral,
  parseJson,
  parseScript,
  prepend,
  property,
  stringUnion,
  stringValue,
  variable,
} from "../../source-edits.ts";

export type WorkshopApp = { name: string; base: string; port: number };

const VITE_CONFIG = "tools/vite/workshop-app.ts";
const SITE_ASSEMBLY = "apps/site/assemble.mjs";
const SITE_PROJECT = "apps/site/project.json";
const HOSTING = "firebase.json";
const LISTING_KINDS = "libs/poster/src/listing.ts";
const WORKSHOP_LIST = "libs/workshop/src/app/workshops.ts";

function required<Node>(node: Node | undefined, what: string): Node {
  if (node === undefined) throw new Error(`Cannot register the workshop: ${what} not found`);
  return node;
}

function workshopApps(source: ts.SourceFile): ts.ObjectLiteralExpression {
  return required(
    objectLiteral(variable(source, "WORKSHOP_APPS")),
    `WORKSHOP_APPS in ${VITE_CONFIG}`,
  );
}

export function readWorkshopApps(tree: Tree): WorkshopApp[] {
  return entries(workshopApps(parseScript(tree, VITE_CONFIG))).flatMap(([name, app]) => {
    const base = stringValue(property(app, "base"));
    const port = numberValue(property(app, "port"));
    return base === undefined || port === undefined ? [] : [{ name, base, port }];
  });
}

export function readListingKinds(tree: Tree): string[] {
  return tree.exists(LISTING_KINDS)
    ? stringUnion(parseScript(tree, LISTING_KINDS), "ListingKind")
    : [];
}

export function readWorkshopIds(tree: Tree): string[] {
  if (!tree.exists(WORKSHOP_LIST)) return [];
  return elements(variable(parseScript(tree, WORKSHOP_LIST), "WORKSHOPS")).flatMap((workshop) => {
    const id = stringValue(property(workshop, "id"));
    return id === undefined ? [] : [id];
  });
}

const mountOf = (base: string) => base.replaceAll("/", "");

export function registerViteApp(tree: Tree, { name, base, port }: WorkshopApp): void {
  insertInto(tree, VITE_CONFIG, parseScript, (source) => [
    append(
      workshopApps(source),
      `${objectKey(name)}: { base: ${JSON.stringify(base)}, port: ${port} }`,
    ),
  ]);
}

export function registerSiteMount(tree: Tree, { name, base }: WorkshopApp): void {
  insertInto(tree, SITE_ASSEMBLY, parseScript, (source) => [
    append(
      required(objectLiteral(variable(source, "mounts")), `mounts in ${SITE_ASSEMBLY}`),
      `${objectKey(name)}: ${JSON.stringify(mountOf(base))}`,
    ),
  ]);
}

export function registerSiteBuild(tree: Tree, { name }: WorkshopApp): void {
  insertInto(tree, SITE_PROJECT, parseJson, (source) => {
    const project = jsonRoot(source);
    const implicitDependencies = arrayLiteral(property(project, "implicitDependencies"));
    const appBuilds = elements(
      property(property(property(project, "targets"), "build"), "dependsOn"),
    )
      .filter((dependency) => stringValue(property(dependency, "target")) === "build")
      .map((dependency) => arrayLiteral(property(dependency, "projects")))
      .find((projects) => projects !== undefined);
    return [
      append(
        required(implicitDependencies, `implicitDependencies in ${SITE_PROJECT}`),
        `"${name}"`,
      ),
      append(required(appBuilds, `build.dependsOn projects in ${SITE_PROJECT}`), `"${name}"`),
    ];
  });
}

export function registerHostingRewrite(tree: Tree, { base }: WorkshopApp): void {
  insertInto(tree, HOSTING, parseJson, (source) => {
    const rewrites = required(
      arrayLiteral(property(property(jsonRoot(source), "hosting"), "rewrites")),
      `hosting.rewrites in ${HOSTING}`,
    );
    const mount = mountOf(base);
    const rewrite = `{ "source": "/${mount}{,/**}", "destination": "/${mount}/index.html" }`;
    const fallback = rewrites.elements.find(
      (candidate) => stringValue(property(candidate, "source")) === "**",
    );
    return [fallback ? prepend(source, fallback, rewrite) : append(rewrites, rewrite)];
  });
}

const DEV_PROJECTS = /-p ((?:[\w-]+ )*[\w-]+) --parallel=\d+/;

export function registerDevServer(tree: Tree, { name }: WorkshopApp): void {
  updateJson<{ scripts?: Record<string, string> }>(tree, "package.json", (packageJson) => {
    const dev = packageJson.scripts?.dev;
    const match = dev === undefined ? null : DEV_PROJECTS.exec(dev);
    if (!packageJson.scripts || !dev || !match?.[1]) {
      logger.warn(`Add ${name} to the projects of the "dev" script in package.json.`);
      return packageJson;
    }
    const projects = [...match[1].split(" "), name];
    packageJson.scripts.dev = dev.replace(
      match[0],
      `-p ${projects.join(" ")} --parallel=${projects.length}`,
    );
    return packageJson;
  });
}
