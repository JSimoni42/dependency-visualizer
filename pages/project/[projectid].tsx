import React from 'react';

const Project: React.FC = () => {
    return (
        <article className="container">
            <h1>Enter a path to one of your project's modules</h1>
            <form method="POST" action="/api/project/view">
                <input type="text" placeholder="Module Path" required={ true }></input>
                <input type="submit"></input>
            </form>
        </article>
    );
};

export default Project;
