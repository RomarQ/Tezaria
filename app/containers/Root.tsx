import React from 'react'
import { Provider } from 'react-redux'
import { History } from 'history'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import blue from '@material-ui/core/colors/blue'
import { ConnectedRouter } from 'connected-react-router'
import { ApolloProvider } from 'react-apollo'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'

import HardwareWalletProvider from '../providers/HardwareWallet/HardwareWallet'

import GQLclient from '../graphql-client'
import App from './App'

interface Props {
  store: any
  history: History
}

const theme = createMuiTheme({
  palette: {
    primary: blue
  }
})

export default (props: Props) => {
  const { store, history } = props
  return (
    <ApolloProvider client={GQLclient}>
      <Provider store={store}>
        <MuiThemeProvider theme={theme}>
          <ConnectedRouter history={history}>
            <HardwareWalletProvider>
              <ToastContainer />
              <App />
            </HardwareWalletProvider>
          </ConnectedRouter>
        </MuiThemeProvider>
      </Provider>
    </ApolloProvider>
  )
}
