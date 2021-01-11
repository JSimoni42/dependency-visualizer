import { createWriteStream, mkdirSync } from 'fs';
import { promisify } from 'util';
import { v4 } from 'uuid';
import { pipeline } from 'stream';
import extractZip from 'extract-zip';
import { execSync } from 'child_process';

const pipe = promisify(pipeline);

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

function yarnOrNpmInstall(uuid: string): void {
  const workingDir = getUncompressedBasePath(uuid);
  const isYarn = execSync(`ls ${workingDir} | grep yarn.lock | wc -l`, { encoding: 'utf-8' }) !== '0';
  const isNpm = execSync(`ls ${workingDir} | grep package.lock | wc -l`, { encoding: 'utf-8' }) !== '0';

  if (isYarn) {
    execSync(`cd ${workingDir} && yarn install`);
  } else if (isNpm) {
    execSync(`cd ${workingDir} && npm install`);
  } else {
    throw new Error('Project uses neither NPM nor Yarn');
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

    yarnOrNpmInstall(uuid);

    return uuid;
}
