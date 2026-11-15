import { applyChangesToString, ChangeType, type StringInsertion, type Tree } from "@nx/devkit";
import ts from "typescript";

type SourceInsert = { index: number; text: string };

type ListLiteral = ts.ObjectLiteralExpression | ts.ArrayLiteralExpression;

function readText(tree: Tree, file: string): string {
  const text = tree.read(file, "utf8");
  if (text === null) throw new Error(`${file} does not exist`);
  return text;
}

export function parseScript(tree: Tree, file: string): ts.SourceFile {
  return ts.createSourceFile(file, readText(tree, file), ts.ScriptTarget.Latest, true);
}

export function parseJson(tree: Tree, file: string): ts.JsonSourceFile {
  return ts.parseJsonText(file, readText(tree, file));
}

export function jsonRoot(source: ts.JsonSourceFile): ts.Expression | undefined {
  return source.statements[0]?.expression;
}

export function insertInto<Source extends ts.SourceFile>(
  tree: Tree,
  file: string,
  parse: (tree: Tree, file: string) => Source,
  inserts: (source: Source) => SourceInsert[],
): void {
  const source = parse(tree, file);
  const changes = inserts(source).map((insert): StringInsertion => ({
    type: ChangeType.Insert,
    ...insert,
  }));
  tree.write(file, applyChangesToString(source.text, changes));
}

function unwrap(node: ts.Expression): ts.Expression {
  return ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isParenthesizedExpression(node)
    ? unwrap(node.expression)
    : node;
}

function keyOf(name: ts.PropertyName): string | undefined {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)
    ? name.text
    : undefined;
}

export function variable(source: ts.SourceFile, name: string): ts.Expression | undefined {
  const declaration = source.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => statement.declarationList.declarations)
    .find((candidate) => ts.isIdentifier(candidate.name) && candidate.name.text === name);
  return declaration?.initializer && unwrap(declaration.initializer);
}

export function stringUnion(source: ts.SourceFile, name: string): string[] {
  const alias = source.statements
    .filter(ts.isTypeAliasDeclaration)
    .find((candidate) => candidate.name.text === name);
  if (!alias) return [];
  const members = ts.isUnionTypeNode(alias.type) ? alias.type.types : [alias.type];
  return members.flatMap((member) =>
    ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal) ? [member.literal.text] : [],
  );
}

export function entries(node: ts.Expression | undefined): Array<[string, ts.Expression]> {
  if (!node || !ts.isObjectLiteralExpression(node)) return [];
  return node.properties.flatMap((member) => {
    const key = ts.isPropertyAssignment(member) ? keyOf(member.name) : undefined;
    return ts.isPropertyAssignment(member) && key !== undefined
      ? [[key, unwrap(member.initializer)]]
      : [];
  });
}

export function property(node: ts.Expression | undefined, key: string): ts.Expression | undefined {
  return entries(node).find(([candidate]) => candidate === key)?.[1];
}

export function elements(node: ts.Expression | undefined): ts.Expression[] {
  return node && ts.isArrayLiteralExpression(node) ? node.elements.map(unwrap) : [];
}

export function stringValue(node: ts.Expression | undefined): string | undefined {
  return node && ts.isStringLiteralLike(node) ? node.text : undefined;
}

export function numberValue(node: ts.Expression | undefined): number | undefined {
  return node && ts.isNumericLiteral(node) ? Number(node.text) : undefined;
}

export function objectLiteral(
  node: ts.Expression | undefined,
): ts.ObjectLiteralExpression | undefined {
  return node && ts.isObjectLiteralExpression(node) ? node : undefined;
}

export function arrayLiteral(
  node: ts.Expression | undefined,
): ts.ArrayLiteralExpression | undefined {
  return node && ts.isArrayLiteralExpression(node) ? node : undefined;
}

export function append(list: ListLiteral, text: string): SourceInsert {
  const items = ts.isArrayLiteralExpression(list) ? list.elements : list.properties;
  const last = items.at(-1);
  return last ? { index: last.end, text: `, ${text}` } : { index: items.pos, text };
}

export function prepend(source: ts.SourceFile, node: ts.Node, text: string): SourceInsert {
  return { index: node.getStart(source), text: `${text}, ` };
}

export function objectKey(name: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name);
}
