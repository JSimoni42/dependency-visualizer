import React, { FormEvent } from 'react';
import { NextRouter, useRouter } from 'next/router';

const MODULE_PATH_NAME = 'module_path';

function isHtmlInput(element: Element | RadioNodeList): element is HTMLInputElement {
  return !('forEach' in element);
}

function onSubmit(e: FormEvent<HTMLFormElement>, projectId: string, router: NextRouter): void {
  e.preventDefault();
  const modulePathRawElement = e.currentTarget.elements.namedItem(MODULE_PATH_NAME)

  if (modulePathRawElement && isHtmlInput(modulePathRawElement)) {
    const path = modulePathRawElement.value;
    const route = `/project/${projectId}/view?${MODULE_PATH_NAME}=${encodeURIComponent(path)}`
    router.push(route);
  }
}

function isValidProjectId(projectId: string | string[] | undefined): projectId is string {
  return typeof projectId === 'string';
}

const Project: React.FC = () => {
  const router = useRouter();
  const {
    projectid
  } = router.query;

    return (
        <article className="container">
            <h1>Enter a path to one of your project's modules</h1>
            {
              isValidProjectId(projectid) ? (
                <form method="GET" onSubmit={ (e) => onSubmit(e, projectid, router) }>
                    <input type="text" placeholder="Module Path" name={ MODULE_PATH_NAME } required={ true }></input>
                    <input type="submit"></input>
                </form>
              ) : (
                <main>
                  Invalid Project
                </main>
              )
            }
        </article>
    );
};

export default Project;
