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

export interface TreeNode {
  filePath: string;
  children: TreeNode[];
}

const myResolver = ResolverFactory.createResolver({
  fileSystem: new CachedInputFileSystem(fs, 4000),
  extensions: [".ts", ".js", ".tsx", ".jsx"],
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

function parseImportLiteralsFromFile(filePath: string): string[] {
  const rawFile = fs.readFileSync(filePath, "utf-8");
  const parsed = parse(rawFile);
  const programBody: ASTNode[] = parsed.program.body;
  const imports = programBody.filter(isImportNode);

  return imports.map((importNode) => importNode.source.value);
}

export async function resolveModulesUntilNodeModule(
  directoryPath: string,
  request: string,
): Promise<TreeNode> {
  const initialPath = await resolveFile(directoryPath, request);

  const importRequestLiterals = parseImportLiteralsFromFile(initialPath);
  const childImportPaths = await Promise.all(
    importRequestLiterals.map(async (importLiteral) => {
      const resolvedPath = await resolveFile(directoryPath, importLiteral)
      return { importLiteral, resolvedPath };
    })
  );

  const nonNodeModulePaths = childImportPaths.filter(({ resolvedPath }) => !resolvedPath.includes("node_modules"))
  const nodeModulePaths = childImportPaths.filter(({ resolvedPath }) => resolvedPath.includes("node_modules"));

  const resolvedChildrenNodes = await Promise.all(
    nonNodeModulePaths.map(({ importLiteral }) => {
      return resolveModulesUntilNodeModule(directoryPath, importLiteral);
    })
  );

  return {
    filePath: request,
    children: [
      ...resolvedChildrenNodes,
      ...nodeModulePaths.map(({ importLiteral }) => {
        return {
          filePath: importLiteral,
          children: [],
        };
      }),
    ],
  };
}
