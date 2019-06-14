import React from 'react';
import { Provider } from 'react-redux';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/blue';
import { ConnectedRouter } from 'connected-react-router';
import GQLclient from '../graphql-client';
import { ApolloProvider } from 'react-apollo';
import { SnackbarProvider } from 'notistack';

import { History } from 'history';
import App from './App';

interface Props {
    store: any;
    history: History;
};

const theme = createMuiTheme({
    palette: {
        primary: blue
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
                        <SnackbarProvider maxSnack={4}>
                            <App />
                        </SnackbarProvider>
                    </ConnectedRouter>
                </MuiThemeProvider>
            </Provider>
        </ApolloProvider>
    );
}
