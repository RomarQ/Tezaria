import { KeysType } from './types';
import { UnsignedOperationProps } from './operations';

export interface RewardControllerInterface {
    feePercentage: number,

    // Methods
    getNumberOfDelegatorsByCycle: (pkh:string, cycle:number) => Promise<number>;
    getRewards: (pkh:string, numberOfCycles:number) => Promise<RewardsInfo>;
    getDelegatorsRewardsByCycle: (pkh:string, cycle:number) => Promise<RewardsSplit>;
    getDelegatorRewardsByCycle: (phk:string, cycle:number) => Promise<DelegatorReward>;
    prepareRewardsToSendByCycle: (pkh: string, cycle: number) => Promise<DelegatorReward[]>;
    sendRewardsByCycle: (pkh: string, cycle: number) => Promise<>;
    sendSelectedRewards: (keys:KeysType, selected:DelegatorReward[]) => Promise<UnsignedOperationProps>;
}

export type RewardsInfo = {
    lost_revelation_fees: number;
    lost_revelation_rewards: number;
    revelation_rewards: number;
    lost_fees_denounciation: number;
    lost_rewards_denounciation: number;
    lost_deposit_from_denounciation: number;
    gain_from_denounciation: number;
    future_endorsing_rewards: number;
    future_baking_rewards: number;
    fees: number;
    endorsements_rewards: number;
    blocks_rewards: number;
    delegated_balance: number;
    delegators_nb: number;
    delegate_staking_balance: number;
    cycle: number;
    status: {
        status: string;
    };
}

export type RewardsSplit = {
    lost_revelation_fees: number;
    lost_revelation_rewards: number;
    revelation_rewards: number;
    lost_fees_denounciation: number;
    lost_rewards_denounciation: number;
    lost_deposit_from_denounciation: number;
    gain_from_denounciation: number;
    future_endorsements_rewards: number;
    future_blocks_rewards: number;
    fees: number;
    endorsements_rewards: number;
    blocks_rewards: number;
    delegators_nb: number;
    delegate_staking_balance: number;
    delegators_balance: {
        balance: number;
        account: {
            tz: string;
            alias?: string;
        };
    }[];
};

export type DelegatorReward = {
    id?: number; 
    pkh?:string;
    paid?: boolean;
    //
    losses: number;
    extra_rewards: number;
    rewards: number;
    balance: number;
    staking_balance: number;
    cycle: number;
    delegate: {
        tz: string;
        alias?: string;
    };
    status: {
        status: string;
    };
}