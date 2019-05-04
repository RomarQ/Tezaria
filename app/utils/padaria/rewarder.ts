import rpc, { QueryTypes } from './rpc';
import utils from './utils';
import operations from './operations';

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

        return rewards.delegators_balance.map(({ account, balance }, index) => {
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
    },
    sendRewardsByCycle: (pkh: string, cycle: number) => {
        const rewards = self.prepareRewardsToSendByCycle(pkh, cycle) as any;
    },
    sendSelectedRewards: (keys, rewards) => {
        const destinations = rewards.map(reward => ({
            destination: reward.delegatorContract,
            amount: String(reward.rewardShare - Number(operations.feeDefaults.low))
        }));

        return operations.transaction(keys.pkh, destinations, keys);
    },
    nextRewardCycle: async () => {
        let cycle = await rpc.getCurrentCycle();

        if (!cycle) return;

        /*
        *   Calculate the current cycle waiting for rewards.
        */
        cycle -= (rpc.networkConstants['preserved_cycles']+1);
        
        // Return the cycle number only if it was never rewarded
        return cycle > self.lastRewardedCycle ? cycle : undefined;
    },
    run: async (keys, head, logger) => {
        console.log('starting rewarder....');
        /*
        *   Get the last cycle that delegators got paid
        */
        if (!self.lastRewardedCycle)
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
        
        if (!self.lastRewardedCycle) return;

        const cycle = await self.nextRewardCycle();

        if (!cycle) return;

        const rewards = await self.prepareRewardsToSendByCycle(keys.pkh, cycle);

        const operations = await self.sendSelectedRewards(keys, rewards);

        self.lastRewardedCycle = cycle;

        const transactionsStatus = operations.reduce((prev, cur) => {
            cur.contents.forEach(transaction => {
                prev.push({
                    cycle,
                    delegate: transaction.source,
                    delegator: transaction.destination,
                    completed: transaction.metadata.operation_result.status === "applied"
                });
            });
            return prev;
        }, []);

        const failedTransactions = rewards.filter(reward => 
            transactionsStatus.indexOf((transaction:any) => transaction.delegator === reward.delegatorContract && transaction.completed) != -1 );

        /*
        *   If there is failed transactions, inform baker.
        */
        if (failedTransactions.length > 0)
            console.log('OPS, failed transactions', failedTransactions);

        /*
        *   Add Succeded transactions to baker database
        */
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
        
        console.log(self.lastRewardedCycle);
    }
};

export * from './rewarder.d';
export default self;