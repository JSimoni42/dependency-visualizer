import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const ViewProject: React.FC = () => {
  const [ rootNode, setRootNode ] = useState<string>('');
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

      const json = await resp.json();

      setRootNode(JSON.stringify(json, null, '\t'));
    }

    fetchData();
  }, [setRootNode, projectid, module_path])

  return (
    <article className="container">
      <pre>
        { rootNode }
      </pre>
    </article>
  );
};

export default ViewProject;
