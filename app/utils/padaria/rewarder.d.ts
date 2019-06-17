import { UnsignedOperationProps } from './operations';

export interface RewardControllerInterface {
	lastRewardedCycle: number;
	paymentsBatchSize: number;
	feePercentage: number;

	// Methods
	getNumberOfDelegatorsByCycle: (
		pkh: string,
		cycle: number
	) => Promise<number>;
	getRewards: (
		pkh: string,
		numberOfCycles: number
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
	DelegationPhk: string;
	Fee: string;
	GrossRewards: string;
	NetRewards: string;
	Share: number;
	Balance: number;
	// Custom
	paid?: boolean;
}

export type RewardsReport = {
	Cycle: number;
	CycleRewards: string;
	DelegatePhk: string;
	Delegations: DelegatorReward[];
	SelfBakedRewards: string;
	TotalFeeRewards: string;
	TotalRewards: string;
};

export interface RewardsReportWithoutDelegations {
	Cycle: number;
	CycleRewards: string;
	DelegatePhk: string;
	TotalDelegations: number;
}
