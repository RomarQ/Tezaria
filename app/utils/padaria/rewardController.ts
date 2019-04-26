import rpc, { QueryTypes } from './rpc';
import utils from './utils';
import operations from './operations';

import {
    RewardControllerInterface,
    DelegatorReward,
    RewardsSplit
} from './rewardController.d';

const DEFAULT_FEE_PERCENTAGE = 10;

const self:RewardControllerInterface = {
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
    prepareRewardsToSendByCycle: async (pkh: string, cycle: number) => {
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
    sendSelectedRewards: async (keys, rewards) => {
        const destinations = rewards.map(reward => ({
            destination: reward.delegatorContract,
            amount: String(reward.rewardShare - Number(operations.feeDefaults.low))
        }));

        return await operations.transaction(keys.pkh, destinations, keys);
    }
};

export * from './rewardController.d';
export default self;