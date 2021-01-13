import { TreeNode } from '@ts/file-resolver';
import { TreeNodeRenderer } from '@ts/TreeNodeRenderer';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const ViewProject: React.FC = () => {
  const [ rootNode, setRootNode ] = useState<TreeNode | undefined>();
  const [error, setError] = useState<string>();
  const router = useRouter();
  const { projectid, module_path } = router.query;

  useEffect(() => {
    async function fetchData() {
      // Import for BabylonJS that requires the window object
      // to be defined. It must be run on the client
      await import('pepjs');

      const resp = await fetch(`/api/project/view`, {
        method: 'POST',
        body: JSON.stringify({
          modulePath: module_path,
          projectId: projectid
        }),
        headers: [['content-type', 'application/json']]
      });

      if (resp.status === 200) {
        const json = await resp.json() as TreeNode;
        setRootNode(json);
      } else {
        const raw = await resp.text();
        setError(raw);
      }
    }

    fetchData();
  }, [setRootNode, projectid, module_path])

  return (
    <article className="container">
      <pre>
        {
          rootNode ? <TreeNodeRenderer treeNode={ rootNode } /> : <aside>Loading...</aside>
        }
        {
          error
        }
      </pre>
    </article>
  );
};

export default ViewProject;
