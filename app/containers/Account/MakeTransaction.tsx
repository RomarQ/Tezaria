import React from 'react'

import Component from '../../components/Account/MakeTransaction'
import Splash from '../Splash'

import rpc from '../../utils/padaria/rpc'

interface Props {
  userData: UserDataProps
}

const Container: React.FC<Props> = ({ userData }) => {
  const isMounted = React.useRef(true)
  const [contract, setContract] = React.useState(null)

  React.useEffect(() => {
    isMounted.current = true

    updateContract()

    return () => (isMounted.current = false)
  }, [])

  const updateContract = async () => {
    try {
      isMounted.current && setContract(await rpc.getContract(userData.keys.pkh))
    } catch (e) {
      console.error(e)
    }
  }

  return !contract ? (
    <Splash />
  ) : (
    <Component
      updateContract={updateContract}
      keys={userData.keys}
      contract={contract}
    />
  )
}

export default Container
