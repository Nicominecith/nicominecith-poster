import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";
import xoTypescript from "eslint-config-xo-typescript";
import tailwindcss from "eslint-plugin-tailwindcss";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import nx from "@nx/eslint-plugin";
import path from "node:path";

// JSON Disabled for xo
const xoTypescriptWithoutJson = xoTypescript.filter(
  (config) => !config.language?.startsWith("json"),
);

export default tseslint.config(
  globalIgnores([
    "**/dist",
    "**/node_modules",
    "**/.nx",
    "eslint.config.mjs",
    "libs/renderer/wasm/**",
    "libs/renderer/rust/**",
    "libs/fonts/src/script-faces/**",
    "libs/fonts/scripts/**",
    "apps/site/**",
  ]),
  ...xoTypescriptWithoutJson,
  tailwindcss.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-refresh": reactRefresh,
      prettier: prettierPlugin,
      "@nx": nx,
    },
    settings: {
      tailwindcss: {
        cssConfigPath: path.join(import.meta.dirname, "libs/styles/src/index.css"),
      },
    },
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: false,
          checkDynamicDependenciesExceptions: ["renderer"],
          allow: [],
          depConstraints: [
            { sourceTag: "type:app", onlyDependOnLibsWithTags: ["type:lib", "type:style"] },
            { sourceTag: "type:lib", onlyDependOnLibsWithTags: ["type:lib", "type:style"] },
            { sourceTag: "type:style", onlyDependOnLibsWithTags: [] },
            { sourceTag: "type:tooling", onlyDependOnLibsWithTags: ["type:tooling"] },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "prettier/prettier": "error",
      "arrow-body-style": "off",
      "no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
      "no-warning-comments": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[optional=true]",
          message:
            "javascript-obfuscator drops the `?.` of optional calls it wraps; guard the call explicitly.",
        },
      ],
      "prefer-arrow-callback": "off",

      // --- xo tuning for this codebase ---
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: ["variable", "function"],
          format: ["strictCamelCase", "StrictPascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: "typeLike",
          format: ["StrictPascalCase"],
        },
        {
          selector: "objectLiteralProperty",
          format: null,
        },
      ],
      // React event handlers are almost always `() => doThing()` shorthand.
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
      // Keep the other restricted-types bans, but this app follows React/DOM
      // convention (`useState<T | null>`, `getElementById` etc.) and uses `null` on purpose.
      "@typescript-eslint/no-restricted-types": [
        "error",
        {
          types: {
            object: {
              message: "The `object` type is hard to use. Use `Record<string, unknown>` instead.",
              fixWith: "Record<string, unknown>",
            },
            Buffer: {
              message: "Use Uint8Array instead.",
              suggest: ["Uint8Array"],
            },
            "[]": "Don't use the empty array type `[]`. It only allows empty arrays. Use `SomeType[]` instead.",
          },
        },
      ],
      // React 19 unions `ReactNode` with `Promise<ReactNode>` for async components,
      // so this rule's type-aware check misfires on plain sync ones.
      "@typescript-eslint/promise-function-async": "off",
      // False positive on this beta plugin version: it claims bare `leading-1.05` works, but
      // Tailwind v4 only generates a rule for the bracketed arbitrary form
      "tailwindcss/no-unnecessary-arbitrary-value": "off",
      "@stylistic/padding-line-between-statements": "off",
      "capitalized-comments": "off",
      "no-negated-condition": "off",
      "no-bitwise": "off",
      "prefer-destructuring": "off",
    },
  },
  {
    // shadcn/ui primitives: they export their cva variants beside the component,
    // and `cn` takes whole class lists rather than literal class names.
    files: ["libs/ui/src/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
      "tailwindcss/no-custom-classname": "off",
    },
  },
  {
    files: ["**/vite.config.ts"],
    rules: {
      "@nx/enforce-module-boundaries": "off",
    },
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  prettierConfig,
);
