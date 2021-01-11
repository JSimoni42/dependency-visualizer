import { TreeNode } from '@ts/file-resolver';
import { TreeNodeRenderer } from '@ts/TreeNodeRenderer';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const ViewProject: React.FC = () => {
  const [ rootNode, setRootNode ] = useState<TreeNode | undefined>();
  const router = useRouter();
  const { projectid, module_path } = router.query;

  useEffect(() => {
    async function fetchData() {
      const resp = await fetch(`/api/project/view`, {
        method: 'POST',
        body: JSON.stringify({
          modulePath: module_path,
          projectId: projectid
        }),
        headers: [['content-type', 'application/json']]
      });

      const json = await resp.json() as TreeNode;
      setRootNode(json);
    }

    fetchData();
  }, [setRootNode, projectid, module_path])

  return (
    <article className="container">
      <pre>
        {
          rootNode ? <TreeNodeRenderer treeNode={ rootNode } /> : <aside>Loading...</aside>
        }
      </pre>
    </article>
  );
};

export default ViewProject;
