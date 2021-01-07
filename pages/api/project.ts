import { IncomingMessage, ServerResponse } from "http"
import Busboy from 'busboy';

import * as ZipProcessor from '@ts/zipProcessor';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method === 'POST') {
        const busboy = new Busboy({
            headers: req.headers
        });

        res.writeProcessing();

        let uuidPromise = Promise.resolve("");
        busboy.on('file', (fieldname, fileStream) => {
            uuidPromise = ZipProcessor.saveProjectZip(fileStream);
        });

        busboy.on('finish', async () => {
            const uuid = await uuidPromise;

            res.writeHead(303, {
                Connection: 'close',
                Location: `/project/${uuid}`
            });
            res.end();
        });

        req.pipe(busboy);
    } else {
        res.statusCode = 400;
        res.end();
    }
}