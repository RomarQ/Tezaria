import React from 'react'
import { Dispatch, bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import LoggerActions, { LoggerActionsPrototypes } from '../actions/logger'
import Component from '../components/Rewards/Rewards'
import rewarder, {
  DelegatorReward,
  RewardsReportWithoutDelegations
} from '../utils/padaria/rewarder'
import Splash from './Splash'

interface Props {
  userData: UserDataProps
  logger: LoggerActionsPrototypes
}

const Container: React.FC<Props> = ({ userData, logger }) => {
  const isMounted = React.useRef(true)
  const [rewards, setRewards] = React.useState([])

  React.useEffect(() => {
    if (rewards.length === 0) {
      const r = [] as RewardsReportWithoutDelegations[]
      rewarder
        .getRewards(userData.keys.pkh, 8, cycleRewards => {
          if (isMounted.current) {
            setRewards([...r, cycleRewards])
          }
          r.push(cycleRewards)
        })
        .catch(e => console.error(e))
    }

    return () => {
      isMounted.current = false
    }
  }, [])

  const handleRewardsPayment = async (
    selected: DelegatorReward[],
    cycle: number,
    updateRewards: () => void
  ) => {
    await rewarder.sendSelectedRewards(
      userData.keys,
      selected,
      cycle,
      (log: LoggerActionProps) => {
        logger.add(log)
      },
      true
    )

    updateRewards()
  }

  return rewards.length === 0 ? (
    <Splash />
  ) : (
    <Component
      pkh={userData.keys.pkh}
      handleRewardsPayment={handleRewardsPayment}
      rewards={rewards}
    />
  )
}

// Logger
const LoggerDispatchers = (dispatch: Dispatch) => ({
  logger: bindActionCreators(LoggerActions, dispatch)
})

export default connect(
  null,
  LoggerDispatchers
)(Container)
