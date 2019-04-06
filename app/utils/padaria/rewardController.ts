import node, { queryAPI } from './utils';

const DEFAULT_FEE_PERCENTAGE = 5;

const self = {
    feePercentage: DEFAULT_FEE_PERCENTAGE,

    getNumberOfDelegatorsByCycle: async (pkh: string, cycle: number):Promise<number> => {
        const [total] = await node.queryAPI(`/nb_delegators/${pkh}?cycle=${cycle}`) as number[];
        return total;
    },
    /*
    *   Returns an array with information about staking balance, number of delegators, rewards, fees, etc.
    */
    getRewards: async (pkh:string, items:number) => {
        const rewards = await queryAPI(`/rewards_split_cycles/${pkh}?number=${items}`);

        return rewards;
    },
    getDelegatorsRewardsByCycle: (pkh: string, cycle: number) => (
        queryAPI(`/rewards_split/${pkh}?cycle=${cycle}`)
    ),
    getDelegatorRewardsByCycle: async (delegatorPKH: string, cycle: number) => {
        const rewards = await queryAPI(`/delegator_rewards/${delegatorPKH}`) as any[]; // TODO
        
        return rewards[0] ? rewards.filter(r => r.cycle === cycle)[0] : undefined;
    },
    prepareRewardsToSendByCycle: (pkh: string, cycle: number) => new Promise(async (resolve, reject) => {
        const rewards = await self.getDelegatorsRewardsByCycle(pkh, cycle) as any;

        let rewardsPerDelegator = [] as any[];

        rewards.delegators_balance.map(async ({ account }:any, index:number) => {
            rewardsPerDelegator.push({id: index, pkh: account.tz, ...await self.getDelegatorRewardsByCycle(account.tz, cycle)})
        });

        console.log(rewardsPerDelegator)
        resolve(rewardsPerDelegator);
    }),
    sendRewardsByCycle: (pkh: string, cycle: number) => {
        const rewards = self.prepareRewardsToSendByCycle(pkh, cycle) as any;

        rewards.delegators_balance.map((reward:any) => (
            console.log()
        ));
    
    }
};

export default self;