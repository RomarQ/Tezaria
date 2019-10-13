import React from 'react'
import HWContext from './HardwareWalletContext'

const withHardwareWallet = <P extends object>(
  Component: React.ComponentType<P>
) => (props: Omit<P, 'hardwareWallet'>) => (
  <HWContext.Consumer>
    {context => <Component {...(props as P)} hardwareWallet={context} />}
  </HWContext.Consumer>
)

export default withHardwareWallet
