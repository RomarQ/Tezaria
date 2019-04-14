import React from 'react';
import { Provider } from 'react-redux';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/blue';
import { ConnectedRouter } from 'connected-react-router';
import GQLclient from '../graphql-client';
import { ApolloProvider } from 'react-apollo';
import App from './App';
import { History } from 'history';

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
        <ApolloProvider client={GQLclient}>
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
