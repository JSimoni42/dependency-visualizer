import { createWriteStream, mkdirSync } from 'fs';
import { promisify } from 'util';
import { v4 } from 'uuid';
import { pipeline } from 'stream';
import extractZip from 'extract-zip';

const pipe = promisify(pipeline);

export async function saveProjectZip(zipInputStream: NodeJS.ReadableStream): Promise<string> {
    const uuid = v4();
    const basePath = `/tmp/${uuid}`;
    const compressedDirPath = `${basePath}/compressed`;

    const compressedPath = `${compressedDirPath}/compressed.zip`;
    mkdirSync(compressedDirPath, { recursive: true });

    const compressedWriteStream = createWriteStream(compressedPath);

    await pipe(zipInputStream, compressedWriteStream);

    const uncompressedPath = `${basePath}/uncompressed`;
    await extractZip(compressedPath, {
        dir: uncompressedPath
    });

    return uuid;
}
