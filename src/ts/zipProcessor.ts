import { createUnzip } from 'zlib';
import { createWriteStream } from 'fs';
import { promisify } from 'util';
import { v4 } from 'uuid';
import { pipeline } from 'stream';

const pipe = promisify(pipeline);

export async function unzipProj(zipFileStream: NodeJS.ReadableStream): Promise<string> {
    const unzip = createUnzip();
    const fileName = `/tmp/${v4()}`;
    const writeStream = createWriteStream(fileName);
    await pipe(zipFileStream, unzip, writeStream)

    return fileName;
}
