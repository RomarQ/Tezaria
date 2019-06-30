import { BakingRight } from './baker'

export interface RPCInterface extends TezariaSettingsProps {
  ready: boolean
  apiClient: any
  network: string
  networkEpoch: string
  networkConstants: NetworkConstants
  load: (options: TezariaSettingsProps) => Promise<boolean>
  setCurrentNetwork: () => Promise<void>
  setNetworkConstants: () => Promise<void>
  getCurrentHead: () => Promise<BlockProps>
  getCurrentLevel: (chainId?: string, blockId?: string) => Promise<LevelProps>
  getCurrentCycle: (chainId?: string, blockId?: string) => Promise<number>
  getBlockHeader: (blockId: string) => Promise<BlockHeaderProps>
  getBlockMetadata: (blockId: string) => Promise<BlockMetadataProps>
  getBakingRights: (
    pkh: string,
    level: number,
    maxPriority?: number,
    chainId?: string,
    blockId?: string
  ) => Promise<BakingRight[]>
  queryNode: (path: string, method: QueryType, args?: any) => Promise<any>
  queryAPI: (query: string, variables?: Record<string, any>) => Promise<any>
  queryRequest: (options: RequestOptions, args?: any) => Promise<any>
  queryStreamRequest: (
    options: RequestOptions,
    cb: (res: any, resolve: () => void) => void
  ) => Promise<any>
  getBalance: (pkh: string) => Promise<number>
  getContract: (pkh: string) => Promise<ContractProps>
  getManager: (contract: string) => Promise<{ key: string; manager: string }>
  getCounter: (pkh: string) => Promise<number>
  getEndorsementOperations: (
    blockId: string
  ) => Promise<UnsignedOperationProps[]>
  getPredecessors: (blockId: string, length: number) => Promise<string[]>
  getBlock: (blockId: string) => Promise<BlockProps>
  getBlockOperations: (blockId: string) => Promise<UnsignedOperationProps[][]>
  getBlockHash: (blockId: string) => Promise<string>
  getPendingOperations: () => Promise<UnsignedOperationProps[][]>
  monitorOperations: (
    callback: (operations: any, resolve: () => void) => void
  ) => Promise<void>
  monitorHeads: (
    chainId: string,
    callback: (header: BlockHeaderProps, resolve: () => void) => void
  ) => Promise<void>
  monitorValidBlocks: (
    chainId: string,
    callback: (header: BlockHeaderProps, resolve: () => void) => void
  ) => Promise<void>
  getEndorsingPower: (
    chainID: string,
    endorsementOp: EndorsementOperationProps
  ) => Promise<number>
}

interface RequestOptions {
  hostname: string
  port: number
  timeout?: number
  path: string
  method: string
  key?: string
  cert?: string
  headers?: {
    [index: string]: string
  }
  agent?: any
  requestCert?: boolean
  rejectUnauthorized?: boolean
}

declare type QueryType = 'GET' | 'POST'

export interface NetworkConstants {
  block_reward?: string
  block_security_deposit?: string
  blocks_per_commitment?: number
  blocks_per_cycle?: number
  blocks_per_roll_snapshot?: number
  blocks_per_voting_period?: number
  cost_per_byte?: string
  endorsement_reward?: string
  endorsement_security_deposit?: string
  endorsers_per_block?: number
  hard_gas_limit_per_block?: string
  hard_gas_limit_per_operation?: string
  hard_storage_limit_per_operation?: string
  max_operation_data_length?: number
  max_proposals_per_delegate?: number
  max_revelations_per_block?: number
  michelson_maximum_type_size?: number
  nonce_length?: number
  origination_size?: number
  preserved_cycles?: number
  proof_of_work_nonce_size?: number
  proof_of_work_threshold?: string
  seed_nonce_revelation_tip?: string
  time_between_blocks?: string[]
  tokens_per_roll?: string
  // New Zeronet constants
  delay_per_missing_endorsement?: string
  endorsement_bonus_intercept?: number
  endorsement_bonus_slope?: number
  endorsement_reward_priority_bonus?: string
  minimum_endorsements_per_priority?: number[]
}
