export interface BakerInterface {
  //
  // States
  //
  active: boolean
  injectedBlocks: string[]
  bakedBlocks: number[]
  pendingBlocks: PendingBlockProps[]
  noncesToReveal: NonceProps[]
  levelWaterMark: number
  //
  // Functions
  //
  getCompletedBakings: (pkh: string) => Promise<CompletedBaking[]>
  getIncomingBakings: (pkh: string) => Promise<IncomingBakings>
  levelCompleted: () => void
  run: (
    pkh: string,
    header: BlockHeaderProps,
    logger: (log: LoggerActionProps) => void
  ) => Promise<NonceProps>
  bake: (
    header: BlockHeaderProps,
    priority: number,
    timestamp: string,
    logger: (log: LoggerActionProps) => void
  ) => Promise<PendingBlockProps>
}

export interface BakingRight {
  cycle?: number
  delegate: string
  priority: number
  estimated_time: string
  level: number
}

export interface IncomingBakings {
  hasData: boolean
  cycle?: number
  bakings?: BakingRight[]
}

export interface CompletedBaking {
  delegate_pkh: string
  level: number
  cycle: number
  priority: number
  baked: boolean
  timestamp: string
  fees: string
  reward: string
}

export interface PendingBlockProps {
  chain_id: string
  data: {
    data: string
    operations: UnsignedOperationProps[][]
  }
  level: number
  seed: string
  seed_nonce_hash: string
  timestamp: string
}
