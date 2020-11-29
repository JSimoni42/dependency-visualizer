import fs from "fs";
import resolve, { CachedInputFileSystem, ResolverFactory } from "enhanced-resolve";

const directoryPath = "./test-proj"
const request = "./index"

const myResolver = ResolverFactory.createResolver({
  fileSystem: new CachedInputFileSystem(fs, 4000),
  extensions: [ ".ts", ".js" ]
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
    )
  });
}


