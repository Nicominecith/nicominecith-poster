import path from "node:path";
import { formatFiles, generateFiles, offsetFromRoot, updateJson, type Tree } from "@nx/devkit";

export type LibraryGeneratorSchema = { name: string };

type TsConfig = { compilerOptions?: { paths?: Record<string, string[]> } };

export async function libraryGenerator(
  tree: Tree,
  { name }: LibraryGeneratorSchema,
): Promise<void> {
  const projectRoot = `libs/${name}`;
  const importPath = `@freetsy/${name}`;
  if (tree.exists(projectRoot)) throw new Error(`${projectRoot} already exists`);

  generateFiles(tree, path.join(import.meta.dirname, "files"), projectRoot, {
    name,
    projectRoot,
    offsetFromRoot: offsetFromRoot(projectRoot),
  });
  updateJson<TsConfig>(tree, "tsconfig.base.json", (tsConfig) => ({
    ...tsConfig,
    compilerOptions: {
      ...tsConfig.compilerOptions,
      paths: {
        ...tsConfig.compilerOptions?.paths,
        [importPath]: [`./${projectRoot}/src/index.ts`],
      },
    },
  }));
  await formatFiles(tree, { sortRootTsconfigPaths: true });
}

export default libraryGenerator;
