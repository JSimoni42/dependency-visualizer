import { createWriteStream, mkdirSync } from 'fs';
import { promisify } from 'util';
import { v4 } from 'uuid';
import { pipeline } from 'stream';
import extractZip from 'extract-zip';
import { execSync } from 'child_process';

const pipe = promisify(pipeline);

function execSyncWithTrim(command: string): string {
  return execSync(command, { encoding: 'utf-8'}).trim();
}

function getBasePath(uuid: string): string {
  return `/tmp/${uuid}`;
}

function getCompressedDirPath(uuid: string): string {
  return `${getBasePath(uuid)}/compressed`;
}

function getCompressedFilePath(uuid: string): string {
  return `${getCompressedDirPath(uuid)}/compressed.zip`;
}

export function getUncompressedBasePath(uuid: string): string {
  return `${getBasePath(uuid)}/uncompressed`;
}

function shouldInstallExternalModules(uuid: string): boolean {
  const workingDir = getUncompressedBasePath(uuid);
  return execSyncWithTrim(`ls ${workingDir} | grep node_modules | wc -l`) === '0';
}

function yarnOrNpmInstall(uuid: string): void {
  const workingDir = getUncompressedBasePath(uuid);
  const isYarn = execSyncWithTrim(`ls ${workingDir} | grep yarn.lock | wc -l`) !== '0';
  const isNpm = execSyncWithTrim(`ls ${workingDir} | grep package.lock | wc -l`) !== '0';

  if (isYarn) {
    execSync(`cd ${workingDir} && yarn install`);
  } else if (isNpm) {
    execSync(`cd ${workingDir} && npm install`);
  } else {
    throw new Error('Project uses neither NPM nor Yarn');
  }
}

/**
 * GitHub's zipped repos have the following structure:
 *    repo-name.zip
 *    |__ /repo-name
 *        |__ [repo-contents]
 *
 * This function moves the contents of the /repo-name dir to
 * /[uuid]/uncompressed and deletes /repo-name
 *
 * @param uuid The uuid of the project
 */
function removeTopDir(uuid: string): void {
  const workingDir = getUncompressedBasePath(uuid);
  if (execSyncWithTrim(`ls ${workingDir} | wc -l`) === '1') {
    const dirName = execSyncWithTrim(`ls ${workingDir}`);
    execSync(`mv ${workingDir}/${dirName}/* ${workingDir}`);
    execSync(`rm -r ${workingDir}/${dirName}`);
  } else {
    const files = execSync(`ls ${workingDir}`);
    throw new Error(`Top level dir has more than one file where one was expected \n ${files}`);
  }
}

export async function saveProjectZip(zipInputStream: NodeJS.ReadableStream): Promise<string> {
    const uuid = v4();
    const compressedFilePath = getCompressedFilePath(uuid);

    mkdirSync(getCompressedDirPath(uuid), { recursive: true });

    const compressedWriteStream = createWriteStream(compressedFilePath);

    await pipe(zipInputStream, compressedWriteStream);

    await extractZip(compressedFilePath, {
        dir: getUncompressedBasePath(uuid)
    });

    removeTopDir(uuid);

    if (shouldInstallExternalModules(uuid)) {
      yarnOrNpmInstall(uuid);
    }

    return uuid;
}
