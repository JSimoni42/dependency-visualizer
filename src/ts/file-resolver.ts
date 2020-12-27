import fs from "fs";
import { CachedInputFileSystem, ResolverFactory } from "enhanced-resolve";
import { parse } from "recast";

interface ASTNode {
  type: string;
}

interface ImportDeclaration extends ASTNode {
  type: "ImportDeclaration";
  source: {
    value: string;
  };
}

interface TreeNode {
  filePath: string;
  children: TreeNode[];
}

const directoryPath = "./test-proj";
const request = "./index";

const myResolver = ResolverFactory.createResolver({
  fileSystem: new CachedInputFileSystem(fs, 4000),
  extensions: [".js"],
});

const context = {};
const resolveContext = {};

function resolveFile(directoryPath: string, request: string): Promise<string> {
  return new Promise((resolve, reject) => {
    myResolver.resolve(
      context,
      directoryPath,
      request,
      resolveContext,
      (err, filePath) => {
        if (filePath) {
          resolve(filePath);
        } else {
          reject(err);
        }
      }
    );
  });
}

function isImportNode(node: ASTNode): node is ImportDeclaration {
  return node.type === "ImportDeclaration";
}

async function resolveModulesInFile1Deep(
  directoryPath: string,
  request: string
) {
  const resolvedPath = await resolveFile(directoryPath, request);

  const importRequestLiterals = parseImportLiteralsFromFile(resolvedPath);
  const resolvedPathPromises = importRequestLiterals.map((importLiteral) => resolveFile(directoryPath, importLiteral));

  const resolvedPaths = await Promise.all(resolvedPathPromises);

  console.log(resolvedPaths);
}

function parseImportLiteralsFromFile(filePath: string): string[] {
  const rawFile = fs.readFileSync(filePath, "utf-8");
  const parsed = parse(rawFile);
  const programBody: ASTNode[] = parsed.program.body;
  const imports = programBody.filter(isImportNode);

  return imports.map((importNode) => importNode.source.value);
}

function removeTopDirFromPath(importPath: string): string {
  const newPathParts = [
    "./",
    ...importPath.split("/").slice(1),
  ];

  return newPathParts.join("/");
}

async function resolveModulesUntilNodeModule(
  directoryPath: string,
  request: string,
): Promise<TreeNode> {
  const initialPath = await resolveFile(directoryPath, request);

  const importRequestLiterals = parseImportLiteralsFromFile(initialPath);
  const childImportPaths = await Promise.all(
    importRequestLiterals.map((importLiteral) => resolveFile(directoryPath, importLiteral))
  );

  const nonNodeModulePaths = childImportPaths.filter((importPath) => !importPath.includes("node_modules"))
  const nodeModulePaths = childImportPaths.filter((importPath) => importPath.includes("node_modules"));

  const resolvedChildrenNodes = await Promise.all(
    nonNodeModulePaths.map((importPath) => {
      return resolveModulesUntilNodeModule(directoryPath, removeTopDirFromPath(importPath));
    })
  );

  return {
    filePath: initialPath,
    children: [
      ...resolvedChildrenNodes,
      ...nodeModulePaths.map((modulePath) => {
        return {
          filePath: modulePath,
          children: [],
        };
      }),
    ],
  };
}

resolveModulesUntilNodeModule(directoryPath, request).then(treeNode => console.log(JSON.stringify(treeNode, null, '\t')));
