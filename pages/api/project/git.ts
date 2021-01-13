import { saveProjectZip } from "@ts/zipProcessor";
import { IncomingMessage, ServerResponse } from "http";
import { get } from "https";
import Busboy from 'busboy';

interface Request extends IncomingMessage {
  body: {
    zipUrl?: string;
  };
}

function redirectToZipUrl(zipUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    get(zipUrl, (res) => {
      const { statusCode } = res;
      const { location } = res.headers;
      if (statusCode === 302 && location) {
        resolve(location)
      } else {
        reject();
      }
    });
  });
}

function downloadZip(zipUrl: string): Promise<string> {
  return new Promise((resolve) => {
    get(zipUrl, async (res) => {
      const uuid = await saveProjectZip(res);
      resolve(uuid);
    });
  });
}

export default async function handler(req: Request, res: ServerResponse): Promise<void> {
  if (req.method === 'POST' && req.body.zipUrl) {
    const { zipUrl } = req.body;

    // At the moment, github redirects you to a different location to fetch zip files
    const actualZipUrl = await redirectToZipUrl(zipUrl);
    const uuid = await downloadZip(actualZipUrl);

    res.writeHead(303, {
      Connection: 'close',
      Location: `/project/${uuid}`
    });
    res.end();
  } else {
    res.statusCode = 400;
    res.end();
  }
}