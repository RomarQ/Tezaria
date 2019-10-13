/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import React from 'react'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import LedgerXTZ from 'hw-app-xtz'

import HWContext, { ContextProps } from './HardwareWalletContext'

interface Props {
  children: React.ReactNode
}

interface State {
  contextValues: ContextProps
  transport?: TransportNodeHid
}

export default class Provider extends React.PureComponent<Props> {
  state: State

  constructor(props: Props) {
    super(props)
    this.state = {
      contextValues: {}
    }

    this.getAddress = this.getAddress.bind(this)
    this.getVersion = this.getVersion.bind(this)
    this.sign = this.sign.bind(this)
    this.login = this.login.bind(this)
  }

  componentDidMount() {
    this.refreshTransport()
  }

  async getAddress(): Promise<{ publicKey: string; pkh: string } | void> {
    const { transport } = this.state

    try {
      const address = await new LedgerXTZ(transport).getAddress(
        "44'/1729'/0'/0'"
      )

      return address
    } catch (e) {
      await this.refreshTransport()

      console.error(e)
    }

    return null
  }

  async getVersion(): Promise<string> {
    const { transport } = this.state

    try {
      const config = await new LedgerXTZ(transport).getAppConfiguration()

      this.setState({ contextValues: { ...config } })

      return config.version
    } catch (e) {
      await this.refreshTransport()

      console.error(e)
    }

    return null
  }

  async login(): Promise<void> {
    const address = await this.getAddress()

    if (address) {
      const { contextValues, ...state } = this.state

      this.setState({
        ...state,
        contextValues: { ...contextValues, ...address }
      })
    }
  }

  async sign(rawBytes: string): Promise<string> {
    const { transport } = this.state

    try {
      return new LedgerXTZ(transport).sign("44'/1729'/0'/0'", `03${rawBytes}`)
    } catch (e) {
      await this.refreshTransport()

      console.error(e)
    }

    return null
  }

  async refreshTransport(): Promise<void> {
    this.setState({ transport: await TransportNodeHid.create() })
  }

  render() {
    const { children } = this.props
    const { contextValues } = this.state

    return (
      <HWContext.Provider
        value={{
          ...contextValues,
          getAddress: this.getAddress,
          getVersion: this.getVersion,
          sign: this.sign,
          login: this.login
        }}
      >
        {children}
      </HWContext.Provider>
    )
  }
}
