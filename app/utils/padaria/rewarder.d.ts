export interface RewarderInterface {
  active: boolean
  lastRewardedCycle?: number
  paymentsBatchSize: number
  feePercentage: number

  // Methods
  getRewards: (
    pkh: string,
    numberOfCycles: number,
    cb?: (cycleRewards: Promise<RewardsReportWithoutDelegations>) => void
  ) => Promise<RewardsReportWithoutDelegations[]>
  getDelegatorsRewardsByCycle: (
    pkh: string,
    cycle: number
  ) => Promise<RewardsReport>
  prepareRewardsToSendByCycle: (
    pkh: string,
    cycle: number
  ) => Promise<RewardsReport>
  sendRewardsByCycle: (
    keys: KeysProps,
    cycle: number,
    logger?: (log: LoggerActionProps) => void
  ) => Promise<void>
  sendSelectedRewards: (
    keys: KeysProps,
    selected: DelegatorReward[],
    cycle: number,
    logger?: (log: LoggerActionProps) => void,
    manual?: boolean // For Manual Payments
  ) => Promise<void>
  nextRewardCycle: () => Promise<number>
  run: (
    keys: KeysProps,
    logger?: (log: LoggerActionProps) => void
  ) => Promise<void>
}

export interface DelegatorReward {
  delegation_pkh: string
  fee: string
  gross_rewards: string
  net_rewards: string
  share: number
  balance: number
  // Custom
  paid?: boolean
}

export interface RewardsReport {
  rewards: string
  delegate_pkh: string
  cycle: number
  delegations: DelegatorReward[]
  SelfBakedRewards: string
  TotalFeeRewards: string
  TotalRewards: string
  fees: string
  total_fee_rewards: string
  self_rewards: string
  total_rewards: string
}

export interface RewardsReportWithoutDelegations {
  delegate_pkh: string
  cycle: number
  total_delegators: number
  rewards: string
  fees: string
  staking_balance: string
}
