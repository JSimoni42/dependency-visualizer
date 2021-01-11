import { createWriteStream, mkdirSync } from 'fs';
import { promisify } from 'util';
import { v4 } from 'uuid';
import { pipeline } from 'stream';
import extractZip from 'extract-zip';

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

export async function saveProjectZip(zipInputStream: NodeJS.ReadableStream): Promise<string> {
    const uuid = v4();
    const basePath = getBasePath(uuid);
    const compressedFilePath = getCompressedFilePath(uuid);

    mkdirSync(getCompressedDirPath(uuid), { recursive: true });

    const compressedWriteStream = createWriteStream(compressedFilePath);

    await pipe(zipInputStream, compressedWriteStream);

    await extractZip(compressedFilePath, {
        dir: getUncompressedBasePath(uuid)
    });

    return uuid;
}
