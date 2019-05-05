import rpc, { QueryTypes } from './rpc';
import utils from './utils';
import operations from './operations';
import storage from '../storage';

import {
    RewardControllerInterface,
    DelegatorReward,
    RewardsSplit
} from './rewarder.d';

const DEFAULT_FEE_PERCENTAGE = 10;

const self:RewardControllerInterface = {
    lastRewardedCycle: null,
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

        const ops = await operations.transaction(keys.pkh, destinations, keys);

        self.lastRewardedCycle = cycle;

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
        *   Save Succeded transactions on storage
        */
        storage.setSentRewardsByCycle(cycle, ops);
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

        console.log(self.lastRewardedCycle, ops);
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

        await self.sendRewardsByCycle(keys, self.lastRewardedCycle + 1);
    }
};

export * from './rewarder.d';
export default self;