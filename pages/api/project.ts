import { IncomingMessage, ServerResponse } from "http"
import Busboy from 'busboy';

import * as ZipProcessor from '@ts/zipProcessor';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default function handler(req: IncomingMessage, res: ServerResponse) {
    const busboy = new Busboy({
        headers: req.headers
    });

    res.writeProcessing();

    let fileName = '';
    busboy.on('file', async (fieldname, fileStream) => {
        fileName = await ZipProcessor.unzipProj(fileStream);
    });

    busboy.on('finish', () => {
        console.log('done processing form');
        res.writeHead(303, {
            Connection: 'close',
            Location: '/'
        });
        res.end();
    });

    req.pipe(busboy);
}