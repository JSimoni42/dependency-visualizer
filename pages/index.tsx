import React from 'react';

const Index: React.FC = () => {
    return (
        <article className="container">
            <h1>Plop the URL to your github repo's zip file here</h1>
            <form action="/api/project/git" method="POST">
                <div>
                  <input type="text" placeholder="https://github.com/JSimoni42/dependency-visualizer/archive/master.zip" name="zipUrl"></input>
                </div>
                <div>
                  <input type="submit"></input>
                </div>
            </form>
        </article>
    );
};

export default Index;
