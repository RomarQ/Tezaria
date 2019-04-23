import rpc, { QueryTypes } from './rpc';
import utils from './utils';
import operations from './operations';

import {
    RewardControllerInterface,
    DelegatorReward,
    RewardsSplit
} from './rewardController.d';

const DEFAULT_FEE_PERCENTAGE = 5;

const self:RewardControllerInterface = {
    feePercentage: DEFAULT_FEE_PERCENTAGE,

    getNumberOfDelegatorsByCycle: async (pkh, cycle) => {
        const [total] = await rpc.queryAPI(`/nb_delegators/${pkh}?cycle=${cycle}`, QueryTypes.GET) as number[];
        return total;
    },
    /*
    *   Returns an array with information about staking balance, number of delegators, rewards, fees, etc.
    */
    getRewards: (pkh, numberOfCycles) => (
        rpc.queryAPI(`/rewards_split_cycles/${pkh}?number=${numberOfCycles}`, QueryTypes.GET)
    ),
    getDelegatorsRewardsByCycle: async (pkh, cycle) => {
        let pageNumber = 0;
        const rewards = await rpc.queryAPI(`/rewards_split/${pkh}?cycle=${cycle}&number=50&p=${pageNumber++}`, QueryTypes.GET) as RewardsSplit;

        while (rewards.delegators_balance.length < rewards.delegators_nb) {
            const nextPage = await rpc.queryAPI(`/rewards_split/${pkh}?cycle=${cycle}&number=50&p=${pageNumber++}`, QueryTypes.GET) as RewardsSplit;
            rewards.delegators_balance = [
                ...rewards.delegators_balance,
                ...nextPage.delegators_balance
            ];
        }

        return rewards;
    },
    getDelegatorRewardsByCycle: async (delegatorPKH: string, cycle: number) => {
        const rewards = await rpc.queryAPI(`/delegator_rewards/${delegatorPKH}`, QueryTypes.GET) as DelegatorReward[];
        
        return rewards[0] ? rewards.filter(r => r.cycle == cycle)[0] : undefined;
    },
    prepareRewardsToSendByCycle: async (pkh: string, cycle: number) => {
        const rewards = await self.getDelegatorsRewardsByCycle(pkh, cycle);

        return Promise.all(
            rewards.delegators_balance.map(async ({ account }:any, index:number) => ({
                id: index, 
                pkh: account.tz,
                ... await self.getDelegatorRewardsByCycle(account.tz, cycle)
            }))
        );
    },
    sendRewardsByCycle: (pkh: string, cycle: number) => {
        const rewards = self.prepareRewardsToSendByCycle(pkh, cycle) as any;
    },
    sendSelectedRewards: async (keys, rewards) => {
        const destinations = rewards.map(r => ({
            destination: r.pkh,
            amount: String(Math.round(utils.getShareReward(r.balance, r.staking_balance, r.rewards) * (100-self.feePercentage) / 100))
        }));

        return await operations.transaction(keys.pkh, destinations, keys);
    }
};

export * from './rewardController.d';
export default self;