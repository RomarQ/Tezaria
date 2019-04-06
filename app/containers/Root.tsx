import React from 'react';
import { Provider } from 'react-redux';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { ConnectedRouter } from 'connected-react-router';
import App from './App';
import { History } from 'history';

type Props = {
  store: any;
  history: History<any>;
};

const theme = createMuiTheme({
  palette: {
    primary: {
      light: "#535671",
      main: "#292d46",
      dark: "#00021f",
    }
  },
  typography: {
    useNextVariants: true,
  }
});

export default class Root extends React.Component<Props> {
  render() {
    const { store, history } = this.props;
    return (
        <Provider store={store}>
          <MuiThemeProvider theme={theme}>
            <ConnectedRouter history={history}>
              <App />
            </ConnectedRouter>
          </MuiThemeProvider>
        </Provider>
    );
  }
}
