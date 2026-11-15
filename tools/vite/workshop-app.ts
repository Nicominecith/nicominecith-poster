import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type ProxyOptions, type UserConfig } from "vite";
import obfuscator from "vite-plugin-javascript-obfuscator";

const WORKSPACE_ROOT = path.resolve(import.meta.dirname, "../..");

const OBFUSCATION_SEED = "freetsy";

const libraryPath = (file: string) => path.join(WORKSPACE_ROOT, "libs", file);

const WORKSHOP_APPS = {
  music: { base: "/", port: 3000 },
  film: { base: "/film/", port: 3001 },
  book: { base: "/buch/", port: 3002 },
} as const;

type WorkshopAppName = keyof typeof WORKSHOP_APPS;

function siblingProxies(name: WorkshopAppName): Record<string, ProxyOptions> {
  if (name !== "music") return {};
  return Object.fromEntries(
    Object.entries(WORKSHOP_APPS)
      .filter(([sibling]) => sibling !== name)
      .map(([, app]) => [
        app.base.replace(/\/$/, ""),
        { target: `http://localhost:${app.port}`, ws: true },
      ]),
  );
}

export function workshopApp(name: WorkshopAppName, root: string): UserConfig {
  const { base, port } = WORKSHOP_APPS[name];
  return defineConfig({
    root,
    base,
    envDir: WORKSPACE_ROOT,
    publicDir: path.join(WORKSPACE_ROOT, "libs/styles/public"),
    cacheDir: path.join(WORKSPACE_ROOT, "node_modules/.vite", name),
    plugins: [
      react(),
      tailwindcss(),
      obfuscator({
        apply: "build",
        exclude: [/node_modules/, /(?:wasm-renderer|parallel-jpeg)\.ts$/, /\/script-faces\//],
        options: {
          seed: OBFUSCATION_SEED,
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.4,
          identifierNamesGenerator: "hexadecimal",
          ignoreImports: true,
          stringArray: true,
          stringArrayEncoding: ["base64"],
          stringArrayShuffle: true,
          stringArrayThreshold: 0.75,
          debugProtection: false,
          selfDefending: false,
        },
      }),
    ],
    resolve: {
      alias: [
        { find: /^@freetsy\/styles$/, replacement: libraryPath("styles/src/index.css") },
        {
          find: /^@freetsy\/renderer\/export$/,
          replacement: libraryPath("renderer/src/export.ts"),
        },
        { find: /^@freetsy\/(ui)\/(.+)$/, replacement: libraryPath("$1/src/$2") },
        { find: /^@freetsy\/([^/]+)$/, replacement: libraryPath("$1/src/index.ts") },
      ],
    },
    server: { port, strictPort: true, proxy: siblingProxies(name) },
    preview: { port, strictPort: true },
    build: {
      outDir: path.join(WORKSPACE_ROOT, "dist/apps", name),
      emptyOutDir: true,
      reportCompressedSize: false,
    },
  });
}
