export interface BakingControllerProps {
  delegate: DelegateProps

  monitoring: boolean

  running: boolean
  endorsing: boolean
  accusing: boolean
  levelOnStart: number
  noncesToReveal: NonceProps[]
  locked: boolean
  locks: {
    endorser: boolean
    rewarder: boolean
  }

  load: (keys: KeysProps) => Promise<DelegateProps>
  revealNonces: (header: BlockHeaderProps) => void
  loadNoncesFromStorage: () => void
  run: (keys: KeysProps, logger: (log: LoggerActionProps) => void) => void
  start: (
    keys: KeysProps,
    options: BakingControllerStartOptions
  ) => Promise<boolean>
  stop: () => void
  checkHashPower: () => Promise<number>
}

export interface DelegateProps {
  // From Request
  revealed?: boolean
  waitingForRights?: boolean
  balance?: number | string
  frozen_balance?: number | string
  frozen_balance_by_cycle?: {
    cycle: number
    deposit: number | string
    fees: number | string
    rewards: number | string
  }[]
  staking_balance?: number | string
  delegated_contracts?: string[]
  delegated_balance?: number | string
  deactivated?: boolean
  grace_period?: number
}

export interface BakingControllerStartOptions {
  rewarding: boolean
  baking: boolean
  endorsing: boolean
  accusing: boolean
  logger: (log: LoggerActionProps) => void
}

export interface BakingControllerState extends BakingControllerStartOptions {
  active?: boolean
}
