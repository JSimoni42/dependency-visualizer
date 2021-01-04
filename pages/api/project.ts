import { IncomingMessage, ServerResponse } from "http"
import Busboy from 'busboy';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    const busboy = new Busboy({
        headers: req.headers
    });

    res.writeProcessing();

    busboy.on('file', (fieldname, file, filename) => {
        let rawFile = '';
        file.on('data', (chunk) => { 
            rawFile += chunk; 
        });
        file.on('end', () => {
            console.log(`${filename} finished!`);
            console.log(rawFile);
        });
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