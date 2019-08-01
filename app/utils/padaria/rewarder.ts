import rpc, { QueryTypes } from './rpc'
import operations from './operations'
import storage from '../storage'
import config from './baker-config.json'

import { LogSeverity, LogOrigins } from './logger'

import { RewarderInterface } from './rewarder.d'

const self: RewarderInterface = {
  active: false,
  paymentsBatchSize: (config as any).paymentsBatchSize,
  feePercentage: (config as any).feePercentage,

  /*
   *   Returns an array with information about staking balance, number of delegators, rewards, fees, etc.
   */
  getRewards: async (pkh, numberOfCycles, cb) => {
    let cycle = (await rpc.getCurrentCycle()) - 1
    const endCycle = cycle - numberOfCycles

    const rewards = []
    for (; cycle > endCycle; cycle -= 1) {
      const reward = rpc.queryNode(
        `/basic-rewards-report/?delegate=${pkh}&cycle=${cycle}`,
        QueryTypes.GET
      )

      // If a callback is provided, then call it
      cb && cb(reward)

      rewards.push(reward)
    }

    return Promise.all(rewards)
  },
  getDelegatorsRewardsByCycle: (pkh, cycle) =>
    rpc.queryNode(
      `/rewards-report/?delegate=${pkh}&cycle=${cycle}&fee=${self.feePercentage}`,
      QueryTypes.GET
    ),
  prepareRewardsToSendByCycle: async (pkh, cycle) => {
    const rewards = await self.getDelegatorsRewardsByCycle(pkh, cycle)

    if (!rewards || !rewards.delegations || Number(rewards.TotalRewards) === 0)
      return rewards

    /*
     *   Get sent rewards for this cycle if there are any
     */
    const sentRewards = (await storage.getSentRewardsByCycle(cycle)).operations

    let transactionsStatus: { [index: string]: boolean } = {}

    if (Array.isArray(sentRewards) && sentRewards.length > 0) {
      transactionsStatus = sentRewards.reduce(
        (prev: { [pkh: string]: boolean }, cur) => {
          const newState = prev

          cur.contents.forEach(transaction => {
            if (transaction.metadata.operation_result.status === 'applied')
              newState[transaction.destination] = true
          })
          return newState
        },
        {}
      )
    }

    rewards.delegations.forEach((reward, index) => {
      rewards.delegations[index].paid = !!transactionsStatus[
        reward.delegation_pkh
      ]
    })

    return rewards
  },
  sendRewardsByCycle: async (keys, cycle, logger) => {
    const rewards = await self.prepareRewardsToSendByCycle(keys.pkh, cycle)

    await self.sendSelectedRewards(keys, rewards.delegations, cycle, logger)
  },
  sendSelectedRewards: async (keys, rewards, cycle, logger, manual = false) => {
    if (manual && self.active) return

    const destinations = [] as {
      destination: string
      amount: string
    }[]

    rewards.forEach(
      ({ net_rewards: netRewards, delegation_pkh: delegator, paid }) => {
        const amount =
          Number(netRewards) - Number(operations.feeDefaults.medium)

        if (!paid && amount > 0) {
          destinations.push({
            destination: delegator,
            amount: String(amount)
          })
        }
      }
    )

    if (destinations.length === 0) {
      await storage.setRewardedCycles(cycle, 0).catch(e => console.error(e))

      self.lastRewardedCycle = cycle
      return
    }

    if (logger) {
      logger({
        message: `Sending ${destinations.length} rewards for cycle ${cycle}`,
        type: 'info',
        severity: LogSeverity.NORMAL,
        origin: LogOrigins.REWARDER
      })
    }

    let i = 0
    for (; i < destinations.length; i += self.paymentsBatchSize) {
      // Get a slice of the total destinations
      const batch = destinations.slice(
        i,
        Math.min(destinations.length, i + self.paymentsBatchSize)
      )

      // Send one batch of the rewards
      // eslint-disable-next-line no-await-in-loop
      const ops = await operations.transaction(
        keys.pkh,
        batch,
        keys,
        undefined,
        undefined,
        undefined,
        self.paymentsBatchSize
      )

      console.log(cycle, ops)

      /*
       *   Get failed transactions if any
       */
      const failedTransactions = ops.reduce(
        (prev, cur) => {
          cur.contents.forEach(transaction => {
            if (transaction.metadata.operation_result.status !== 'applied')
              prev.push(transaction.destination)
          })
          return prev
        },
        [] as string[]
      )

      /*
       *   Save transactions on storage
       */
      // eslint-disable-next-line no-await-in-loop
      await storage.setSentRewardsByCycle(cycle, ops).catch()
      // eslint-disable-next-line no-await-in-loop
      await storage.setRewardedCycles(
        cycle,
        batch.length - failedTransactions.length
      )

      if (logger) {
        /*
         *   If there are failed transactions, inform baker.
         */
        if (failedTransactions.length > 0) {
          logger({
            message: `A total of ${failedTransactions.length} rewards failed to be sent for cycle ${cycle}, operation: ${ops[0].hash}`,
            type: 'error',
            severity: LogSeverity.VERY_HIGH,
            origin: LogOrigins.REWARDER
          })
        } else {
          logger({
            message: `Rewards Batch [${i}, ${Math.min(
              destinations.length,
              i + self.paymentsBatchSize
            )}] completed! Op Hash: ${ops[0].hash}`,
            type: 'success',
            severity: LogSeverity.NORMAL,
            origin: LogOrigins.REWARDER
          })
        }
      }

      /*
       *   Stop rewarding if baker stopped the rewarder module
       *   (Rewarder should never be terminated during a transaction)
       *   This ensures that data corruption will not occur if baker stops the rewarder during rewarding process
       */
      if (!self.active && !manual) {
        i += self.paymentsBatchSize
        break
      }
    }

    if (logger) {
      logger({
        message: `A total of ${Math.min(
          i,
          destinations.length
        )} rewards were sent for cycle ${cycle}`,
        type: 'success',
        severity: LogSeverity.NORMAL,
        origin: LogOrigins.REWARDER
      })
    }

    self.lastRewardedCycle = cycle
  },
  nextRewardCycle: async () => {
    const cycle = await rpc.getCurrentCycle()

    if (!cycle) return null

    /*
     *   Calculate the current cycle waiting for rewards.
     */
    return cycle - (rpc.networkConstants.preserved_cycles + 1)
  },
  run: async (keys, logger) => {
    console.log('starting rewarder....')
    /*
     *   Get the last cycle that delegators got paid
     */
    if (!self.lastRewardedCycle)
      self.lastRewardedCycle = await self.nextRewardCycle()

    const cycle = await self.nextRewardCycle()

    /*
     *   Don't send any rewards before it's respective time
     */
    if (!cycle || cycle < self.lastRewardedCycle + 1) {
      /*
       *   Wait a minute before checking again
       *   Just to avoid spamming the network with useless requests
       */
      await new Promise(resolve => setTimeout(resolve, 60000))
      return
    }

    await self.sendRewardsByCycle(keys, self.lastRewardedCycle + 1, logger)
  }
}

export * from './rewarder.d'
export default self
