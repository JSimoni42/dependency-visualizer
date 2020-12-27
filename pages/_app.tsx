// Global Stylesheets
import '@css/skeleton.css';
import '@css/normalize.css';

interface AppProps {
    Component: React.FunctionComponent;
    pageProps: Record<string, unknown>;
}

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
    return <Component { ...pageProps } />
};

export default App;
