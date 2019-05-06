import rpc, { QueryTypes } from './rpc';
import utils from './utils';
import operations, { MAX_BATCH_SIZE } from './operations';
import bakingController from './bakingController';
import storage from '../storage';

import {
    RewardControllerInterface,
    DelegatorReward,
    RewardsSplit
} from './rewarder.d';

const DEFAULT_FEE_PERCENTAGE = 10;

const self:RewardControllerInterface = {
    lastRewardedCycle: null,

    paymentsBatchSize: MAX_BATCH_SIZE,
    feePercentage: DEFAULT_FEE_PERCENTAGE,

    getNumberOfDelegatorsByCycle: async (pkh, cycle) => {
        const [total] = await rpc.queryTzScan(`/nb_delegators/${pkh}/?cycle=${cycle}`, QueryTypes.GET) as number[];
        return total;
    },
    /*
    *   Returns an array with information about staking balance, number of delegators, rewards, fees, etc.
    */
    getRewards: (pkh, numberOfCycles) => (
        rpc.queryTzScan(`/rewards_split_cycles/${pkh}/?number=${numberOfCycles}`, QueryTypes.GET)
    ),
    getDelegatorsRewardsByCycle: async (pkh, cycle) => {
        let pageNumber = 0;
        const rewards = await rpc.queryTzScan(`/rewards_split/${pkh}/?cycle=${cycle}&number=50&p=${pageNumber++}`, QueryTypes.GET) as RewardsSplit;

        while (rewards.delegators_balance.length < rewards.delegators_nb) {
            const nextPage = await rpc.queryTzScan(`/rewards_split/${pkh}/?cycle=${cycle}&number=50&p=${pageNumber++}`, QueryTypes.GET) as RewardsSplit;
            rewards.delegators_balance = [
                ...rewards.delegators_balance,
                ...nextPage.delegators_balance
            ];
        }

        return rewards;
    },
    getDelegatorRewardsByCycle: async (delegatorPKH: string, cycle: number) => {
        const rewards = await rpc.queryTzScan(`/delegator_rewards/${delegatorPKH}`, QueryTypes.GET) as DelegatorReward[];
        
        return rewards[0] ? rewards.filter(r => r.cycle == cycle)[0] : undefined;
    },
    prepareRewardsToSendByCycle: async (pkh, cycle) => {
        let rewards = await self.getDelegatorsRewardsByCycle(pkh, cycle);

        if (!rewards) return;

        rewards.totalRewards = rewards.blocks_rewards+rewards.endorsements_rewards+rewards.revelation_rewards+rewards.fees;

        let preparedRewards = rewards.delegators_balance.map(({ account, balance }, index) => {
            const rewardShare = utils.getRewardShare(balance, rewards.delegate_staking_balance, rewards.totalRewards);
            const rewardFee = utils.getRewardFee(rewardShare, self.feePercentage);
            return {
                id: index,
                delegatorContract: account.tz,
                rewardSharePercentage: utils.getRewardSharePercentage(balance, rewards.delegate_staking_balance),
                rewards: rewards.totalRewards,
                rewardShare: rewardShare - rewardFee,
                balance,
                rewardFee,
                cycle
            }
        });

        /*
        *   Get sent rewards for this cycle if there are any
        */
        const sentRewards = (await storage.getSentRewardsByCycle(cycle)).operations;

        if (Array.isArray(sentRewards) && sentRewards.length > 0) {
            const succeededTransactions = sentRewards.reduce((prev, cur) => {
                cur.contents.forEach(transaction => {
                    if (transaction.metadata.operation_result.status === "applied")
                        prev.push(transaction.destination);
                });
                return prev;
            }, [] as string[]);

            preparedRewards = preparedRewards.map(reward => ({
                ...reward,
                paid: succeededTransactions.some(delegator => delegator === reward.delegatorContract)
            }));

            /*
            *   Decided to remove the external API on this process for sake of simplicity for new bakers

                // This code will possible be used in future versions, since I plan this tool to be customizable.

                const paidRewards = await rpc.queryAPI(`
                    query paidRewards($cycle: Int!, $delegate: String!) {
                        cycle_reward_payment (
                            where: {
                                cycle: {_eq: $cycle},
                                delegate: {_eq: $delegate},
                                completed: {_eq: true}
                            }
                        )
                        {
                            delegator
                        }
                    }
                `);

                preparedRewards = preparedRewards.map(reward => ({
                    ...reward,
                    paid: paidRewards.cycle_reward_payment.some(({delegator}:any) => delegator === reward.delegatorContract)
                }));
            */
        }

        return preparedRewards;
    },
    sendRewardsByCycle: async (keys, cycle) => {
        console.log('cycle ' + cycle)
        const rewards = await self.prepareRewardsToSendByCycle(keys.pkh, cycle);

        await self.sendSelectedRewards(keys, rewards, cycle);
    },
    sendSelectedRewards: async (keys, rewards, cycle) => {
        const destinations = [] as any[];

        rewards.forEach(reward => {
            if (reward.paid) return;

            destinations.push({
                destination: reward.delegatorContract,
                amount: String(reward.rewardShare - Number(operations.feeDefaults.low))
            });
        });

        if (destinations.length === 0) {
            await storage.setLastRewardedCycle(cycle);
            self.lastRewardedCycle = cycle;
            return;
        }

        for (let i = 0; i < destinations.length; i+=self.paymentsBatchSize) {
            // Get a slice of the total destinations
            const batch = destinations.slice(i, Math.min(destinations.length, i+self.paymentsBatchSize));
            // Send one batch of the rewards
            const ops = await operations.transaction(keys.pkh, batch, keys, undefined, undefined, undefined, self.paymentsBatchSize);

            console.log(self.lastRewardedCycle, ops);
            /*
            *   Save transactions on storage
            */
            await storage.setSentRewardsByCycle(cycle, ops);

            /*
            *   Get failed transactions if any
            */
            const failedTransactions = ops.reduce((prev, cur) => {
                cur.contents.forEach(transaction => {
                    if (transaction.metadata.operation_result.status !== "applied")
                        prev.push(transaction.destination);
                });
                return prev;
            }, [] as string[]);
    
            /*
            *   If there is failed transactions, inform baker.
            */
            if (failedTransactions.length > 0)
                console.log('OPS, failed transactions', failedTransactions);

            /*
            *   Stop rewarding if baker stopped the rewarder module
            *   (Rewarder should never be terminated during a transaction)
            *   This ensures that data corruption will not occur if baker stops the rewarder during rewarding process
            */
            if (!bakingController.rewarding)
                break;
        }

        self.lastRewardedCycle = cycle;
        /*
        *   Decided to remove the external API on this process for sake of simplicity for new bakers

            // This code will possible be used in future versions, since I plan this tool to be customizable.

            await rpc.queryAPI(`
                mutation insertRewards($list: [cycle_reward_payment_insert_input!]!) {
                    insert_cycle_reward_payment (
                        objects: $list
                    ) {
                        affected_rows
                    }
                }
            `,
            { list: transactionsStatus });
        */
    },
    nextRewardCycle: async () => {
        let cycle = await rpc.getCurrentCycle();

        if (!cycle) return;

        /*
        *   Calculate the current cycle waiting for rewards.
        */
        cycle -= (rpc.networkConstants['preserved_cycles']+1);
        
        return cycle;
    },
    run: async (keys, logger) => {
        console.log('starting rewarder....');
        /*
        *   Get the last cycle that delegators got paid
        */
        if (!self.lastRewardedCycle)
            self.lastRewardedCycle = (await storage.getLastRewardedCycle()).cycle;
            /*
            *   Decided to remove the external API on this process for sake of simplicity for new bakers

                // This code will possible be used in future versions, since I plan this tool to be customizable.

                self.lastRewardedCycle = await rpc.queryAPI(`
                    query {
                        rewarded_cycles_aggregate {
                            aggregate {
                                max {
                                    cycle
                                }
                            }
                        }
                    }
                `)
                .then(res => res && res.rewarded_cycles_aggregate)
                .then(res => res && res.aggregate)
                .then(res => res && res.max && res.max.cycle);
            */

        const cycle = await self.nextRewardCycle();

        /*
        *   Don't send any rewards if there was rewards send on a cycle ahead
        */
        if (!cycle || cycle < self.lastRewardedCycle) return;

        await self.sendRewardsByCycle(keys, self.lastRewardedCycle+1);
    }
};

export * from './rewarder.d';
export default self;