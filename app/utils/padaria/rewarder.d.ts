import { UnsignedOperationProps } from './operations';

export interface RewardControllerInterface {
	lastRewardedCycle: number;
	paymentsBatchSize: number;
	feePercentage: number;

	// Methods
	getRewards: (
		pkh: string,
        numberOfCycles: number,
        cb?: (cycleRewards) => void
	) => Promise<RewardsReportWithoutDelegations[]>;
	getDelegatorsRewardsByCycle: (
		pkh: string,
		cycle: number
	) => Promise<RewardsReport>;
	prepareRewardsToSendByCycle: (
		pkh: string,
		cycle: number
	) => Promise<RewardsReport>;
	sendRewardsByCycle: (
		keys: KeysType,
		cycle: number,
		logger?: (log: LoggerActionProps) => void
	) => Promise<void>;
	sendSelectedRewards: (
		keys: KeysType,
		selected: DelegatorReward[],
		cycle: number,
        logger?: (log: LoggerActionProps) => void,
        manual?: boolean // For Manual Payments
	) => Promise<void>;
	nextRewardCycle: () => Promise<number>;
	run: (keys: KeysType, logger?: (log: LoggerActionPropss) => void) => Promise<void>;
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
};

interface DelegatorReward {
    delegation_pkh: string;
	fee: string;
	gross_rewards: string;
	net_rewards: string;
	share: number;
	balance: number;
	// Custom
	paid?: boolean;
}

export type RewardsReport = {
	rewards: string;
    delegate_pkh: string;
    cycle: number;
	Delegations: DelegatorReward[];
	SelfBakedRewards: string;
	TotalFeeRewards: string;
    TotalRewards: string;
	fees: string;
	total_fee_rewards: string;
	self_rewards: string;
	total_rewards: string;
};

export interface RewardsReportWithoutDelegations {
    delegate_pkh: string;
    cycle: number;
    total_delegators: number;
    rewards: string;
    fees: string;
    staking_balance: string;
}
