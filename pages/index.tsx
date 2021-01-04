import React from 'react';

const Index: React.FC = () => {
    return (
        <article className="container">
            <h1>Plop your zipped project right here</h1>
            <form action="/api/project" method="POST" encType="multipart/form-data">
                <input name="project" type="file" required={ true }></input>
                <input type="submit"></input>
            </form>
        </article>
    );
};

export default Index;
