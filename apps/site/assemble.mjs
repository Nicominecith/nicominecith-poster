import { cpSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const site = path.join(root, "dist/site");
const mounts = { music: "", film: "film", book: "buch" };

rmSync(site, { recursive: true, force: true });
for (const [app, mount] of Object.entries(mounts)) {
  cpSync(path.join(root, "dist/apps", app), path.join(site, mount), { recursive: true });
}
