import React from 'react'

export interface ContextProps {
  version?: string
  publicKey?: string
  address?: string
}

export interface HardwareWalletContextInterface extends ContextProps {
  getAddress: () => Promise<{ publicKey: string; pkh: string } | void>
  getVersion: () => Promise<string>
  sign: (rawBytes: string) => Promise<string>
  login: () => Promise<void>
}

export default React.createContext<HardwareWalletContextInterface | null>(null)
