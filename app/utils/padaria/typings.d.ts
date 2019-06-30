declare module 'bs58check'
declare module 'electron-json-storage'

declare interface TezariaSettingsProps {
  nodeAddress?: string
  nodePort?: number
  apiAddress?: string
  delegatorFee?: number
  rewardsBatchSize?: number
}

declare interface LoggerActionProps {
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  severity?: string
  origin?: string
}

declare interface ContractProps {
  manager: string
  balance: string
  spendable: boolean
  delegate: {
    setable: boolean
    value: string
  }
  counter: number
}

declare interface ContractManager {
  [address: string]: {
    key: string
    manager: string
  }
}

declare interface KeysProps {
  encrypted: boolean
  sk?: string
  pk?: string
  pkh: string
}

declare interface BlockProps {
  chain_id: string
  hash: string
  header: BlockHeaderProps
  metadata: BlockMetadataProps
  operations: UnsignedOperationProps
  protocol?: string
}

// Operations

declare interface UnsignedOperationProps {
  chain_id?: string
  protocol?: string
  branch: string
  contents: OperationContentsWithResult[]
  signature?: string
  hash?: string

  // Custom
  signedOperationContents?: string
}

declare interface UnsignedOperations {
  [endorsements: number]: EndorsementOperationProps[]
}

declare interface OperationContentsWithResult extends OperationProps {
  metadata?: {
    operation_result: OperationResult
  }
}

declare interface OperationProps {
  kind: OperationType
  source?: string
  fee?: number | string
  nonce?: string
  level?: number
  slot?: number
  pkh?: string
  bh1?: BlockHeaderProps
  bh2?: BlockHeaderProps
  secret?: string
  counter?: number | string
  gas_limit?: number | string
  storage_limit?: number | string
  delegate?: string
  amount?: number | string
  destination?: string
  public_key?: string
}

declare type OperationType =
  | 'endorsement'
  | 'seed_nonce_revelation'
  | 'double_endorsement_evidence'
  | 'double_baking_evidence'
  | 'activate_account'
  | 'proposals'
  | 'ballot'
  | 'reveal'
  | 'transaction'
  | 'origination'
  | 'delegation'

declare interface PendingOperations {
  applied: OperationStatus[]
  branch_delayed: OperationStatus[]
  branch_refused: OperationStatus[]
  refused: OperationStatus[]
  unprocessed?: OperationStatus[]
}

declare interface OperationStatus {
  hash: string
  branch: string
  data: string
  error?: any[]
}

declare interface EndorsementOperationProps {
  chain_id?: string
  protocol?: string
  branch: string
  contents: {
    kind: OperationType
    level: number
    slot: number
  }[]
  signature?: string
  hash?: string
}

declare type OperationResult =
  | {
      status: 'applied'
      consumed_gas?: number
    }
  | {
      status: 'failed'
      errors: string[]
    }
  | {
      status: 'skipped'
    }
  | {
      status: 'backtracked'
      errors?: string[]
      consumed_gas?: number
    }

declare interface TransactionDestination {
  destination: string
  amount: string
  // Not yet implemented
  /* eslint @typescript-eslint/no-explicit-any: ["off"] */
  parameter?: any
}

// !

declare interface NonceProps {
  hash: string
  seedNonceHash: string
  seed: string
  level: number
}

declare interface BlockHeaderProps {
  chain_id: string
  context: string
  hash: string
  fitness: string[]
  level: number
  operations_hash: string
  predecessor: string
  priority: number
  seed_nonce_hash?: string
  proof_of_work_nonce: string
  proto: number
  protocol?: string
  signature: string
  timestamp: string
  validation_pass: number
}

declare interface LevelProps {
  cycle: number
  cycle_position: number
  expected_commitment: boolean
  level: number
  level_position: number
  voting_period: number
  voting_period_position: number
}

declare interface BlockMetadataProps {
  baker: string
  balance_updates: {
    cycle?: number
    delegate?: string
    change: string
    contract?: string
    kind: string
  }[]
  consumed_gas: string
  deactivated: []
  level: LevelProps
  max_block_header_length: number
  max_operation_data_length: number
  max_operation_list_length: {
    max_op: number
    max_size: number
  }[]
  max_operations_ttl: number
  next_protocol: string
  nonce_hash: string
  protocol: string
  test_chain_status: {
    status: string
  }
  voting_period_kind: string
}
