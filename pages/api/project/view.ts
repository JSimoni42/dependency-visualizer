import { resolveModulesUntilNodeModule } from "@ts/file-resolver";
import { getUncompressedBasePath } from "@ts/zipProcessor";
import { IncomingMessage, ServerResponse } from "http";

interface ReqWithBody extends IncomingMessage {
  body: {
    modulePath?: string;
    projectId?: string;
  };
}

export default async function handler(req: ReqWithBody, resp: ServerResponse) {
  const {modulePath, projectId} = req.body;
  if (req.method === 'POST' && modulePath && projectId) {
    const projectDirectory = getUncompressedBasePath(projectId);
    const rootNode = await resolveModulesUntilNodeModule(
      projectDirectory,
      modulePath
    );

    resp.statusCode = 200;
    resp.setHeader('content-type', 'application/json');
    resp.end(rootNode);
  } else {
    resp.statusCode = 400;
    resp.end();
  }
}