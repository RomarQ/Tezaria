import React from 'react'
import { History } from 'history'
import withHardwareWallet from '../../providers/HardwareWallet/withHardwareWallet'
import { SetBakerKeysPrototype } from '../../actions/userData'

import routes from '../../constants/routes.json'
import { HardwareWalletContextInterface } from '../../providers/HardwareWallet/HardwareWalletContext'
import utils, { Prefix } from '../../utils/padaria/utils'

interface Props {
  history: History
  setBakerKeys: SetBakerKeysPrototype
  hardwareWallet: HardwareWalletContextInterface
}

const Container: React.FC<Props> = ({
  history,
  setBakerKeys,
  hardwareWallet,
  ...props
}) => {
  hardwareWallet.getAddress().then(address => {
    if (address) {
      setBakerKeys(
        {
          ledger: true,
          pk: address.publicKey,
          pkh: address.pkh,
          encrypted: false
        },
        hardwareWallet.sign
      )

      history.push(routes.DASHBOARD)
    }
  })

  return <></>
}

export default withHardwareWallet(Container)
;(window as any).ttt = (pk: string) => {
  console.log(utils.hexToBuffer(pk), pk.length)
  return utils.b58encode(utils.hexToBuffer(pk), Prefix.edpk)
}
;(window as any).tttt = (pk: string) => {
  console.log(utils.b58decode(pk, Prefix.edpk))
  console.log(
    utils.bufferToHex(utils.b58decode(pk, Prefix.edpk)),
    utils.bufferToHex(utils.b58decode(pk, Prefix.edpk)).length
  )
}
