import React from 'react';
import { Provider } from 'react-redux';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/blue';
import { ConnectedRouter } from 'connected-react-router';
import { ApolloClient } from 'apollo-client';
import { ApolloProvider } from 'react-apollo';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import App from './App';
import { History } from 'history';

const client = new ApolloClient({
    link: new HttpLink({
        uri: "http://68.183.44.169/v1alpha1/graphql",
        headers: {
            "X-Hasura-Admin-Secret": 'myadminsecretkey'
        }
    }),
    cache: new InMemoryCache()
});

type Props = {
    store: any;
    history: History<any>;
};

const theme = createMuiTheme({
    palette: {
        primary: blue
        /* {
            light: "#535671",
            main: "#292d46",
            dark: "#00021f",
        } */
    },
    typography: {
        useNextVariants: true,
    }
});

export default (props:Props) => {
    const { store, history } = props;
    return (
        <ApolloProvider client={client}>
            <Provider store={store}>
                <MuiThemeProvider theme={theme}>
                    <ConnectedRouter history={history}>
                        <App />
                    </ConnectedRouter>
                </MuiThemeProvider>
            </Provider>
        </ApolloProvider>
    );
}
