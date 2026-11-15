import path from "node:path";
import { formatFiles, generateFiles, logger, names, offsetFromRoot, type Tree } from "@nx/devkit";
import {
  readListingKinds,
  readWorkshopApps,
  readWorkshopIds,
  registerDevServer,
  registerHostingRewrite,
  registerSiteBuild,
  registerSiteMount,
  registerViteApp,
  type WorkshopApp,
} from "./registrations.ts";

export type WorkshopGeneratorSchema = {
  name: string;
  base?: string;
  port?: number;
  kind?: string;
};

function resolveApp(tree: Tree, { name, base, port }: WorkshopGeneratorSchema): WorkshopApp {
  const apps = readWorkshopApps(tree);
  const app = {
    name,
    base: base ?? `/${name}/`,
    port: port ?? Math.max(...apps.map((existing) => existing.port)) + 1,
  };
  if (tree.exists(`apps/${name}`)) throw new Error(`apps/${name} already exists`);
  for (const existing of apps) {
    if (existing.name === app.name) throw new Error(`Workshop ${name} is already registered`);
    if (existing.base === app.base) throw new Error(`${app.base} is taken by ${existing.name}`);
    if (existing.port === app.port)
      throw new Error(`Port ${app.port} is taken by ${existing.name}`);
  }
  return app;
}

function resolveIdentity(
  tree: Tree,
  { name, kind }: WorkshopGeneratorSchema,
  { base }: WorkshopApp,
) {
  const listingKinds = readListingKinds(tree);
  const workshopIds = readWorkshopIds(tree);
  const borrowed = kind ?? listingKinds[0];
  if (
    borrowed === undefined ||
    !listingKinds.includes(borrowed) ||
    !workshopIds.includes(borrowed)
  ) {
    throw new Error(`--kind must be one of: ${listingKinds.join(", ")}`);
  }
  const ownKind = listingKinds.includes(name);
  const ownId = workshopIds.includes(name);
  const followUps = [
    !ownKind && `Add "${name}" to ListingKind and WORKSHOP_FORMATS in libs/poster/src/listing.ts.`,
    !ownId &&
      `Add { id: "${name}", href: "${base}", label: "nav.${name}" } to WORKSHOPS in libs/workshop/src/app/workshops.ts and nav.${name} to libs/i18n/locales/*/common.json.`,
    !(ownKind && ownId) &&
      `Then replace "${borrowed}" with "${name}" in apps/${name}/src/main.tsx and apps/${name}/src/${names(name).fileName}-workshop.tsx.`,
  ].filter((step) => typeof step === "string");
  return { kind: ownKind ? name : borrowed, workshopId: ownId ? name : borrowed, followUps };
}

export async function workshopGenerator(
  tree: Tree,
  options: WorkshopGeneratorSchema,
): Promise<void> {
  const app = resolveApp(tree, options);
  const { kind, workshopId, followUps } = resolveIdentity(tree, options, app);
  const projectRoot = `apps/${app.name}`;
  const { fileName, propertyName, className } = names(app.name);

  generateFiles(tree, path.join(import.meta.dirname, "files"), projectRoot, {
    name: app.name,
    fileName,
    propertyName,
    className,
    kind,
    workshopId,
    projectRoot,
    offsetFromRoot: offsetFromRoot(projectRoot),
  });
  registerViteApp(tree, app);
  registerSiteMount(tree, app);
  registerSiteBuild(tree, app);
  registerHostingRewrite(tree, app);
  registerDevServer(tree, app);
  await formatFiles(tree);

  logger.info(`Workshop ${app.name} serves ${app.base} on port ${app.port}.`);
  if (followUps.length > 0) {
    logger.info(
      [
        `It borrows the "${kind}" listing kind and "${workshopId}" navigation entry until it has its own:`,
        ...followUps.map((step) => `  - ${step}`),
      ].join("\n"),
    );
  }
}

export default workshopGenerator;
