import { HeadType } from './types';

export interface RPCInterface {
    ready: boolean;
    nodeAddress: string;
    apiAddress: string;
    network: string;
    networkEpoch: string;
    debug: boolean;
    cycleLength: number;
    BLOCKS_PER_COMMITMENT: number;
    blockTime: number;
    threshold: number;
    PowHeader: string;
    networkConstants: {},
    watermark: WaterMarkType;
    uTEZ:   TezosUnitType;
    mTEZ:   TezosUnitType;
    TEZ:    TezosUnitType;
    KTEZ:   TezosUnitType;
    MTEZ:   TezosUnitType;
    setDebugMode: (mode:boolean) => void,
    load: (options:LoadOptions) => Promise<boolean>;
    setCurrentNetwork: () => Promise<void>;
    setNetworkConstants: () => Promise<void>;
    getCurrentHead: () => Promise<HeadType>;
    queryNode: (path:string, type:QueryType, args?:any) => Promise<any>;
    queryAPI: (path:string, type:QueryType, args?:any) => Promise<any>;
}

export type QueryType = 
    | 'GET'
    | 'POST';

export type LoadOptions = {
    nodeAddress: string;
    apiAddress: string;
}

export type TezosUnitType = {
    char: string;
    unit: number;
}

export type WaterMarkType = {
    blockHeader: Uint8Array,
    endorsement: Uint8Array,
    genericOperation: Uint8Array
}

export type NetworkConstants = {
    block_reward: string;
    block_security_deposit: string;
    blocks_per_commitment: number;
    blocks_per_cycle: number;
    blocks_per_roll_snapshot: number;
    blocks_per_voting_period: number;
    cost_per_byte: string;
    endorsement_reward: string;
    endorsement_security_deposit: string;
    endorsers_per_block: number;
    hard_gas_limit_per_block: string;
    hard_gas_limit_per_operation: string;
    hard_storage_limit_per_operation: string;
    max_operation_data_length: number;
    max_proposals_per_delegate: number;
    max_revelations_per_block: number;
    michelson_maximum_type_size: number;
    nonce_length: number;
    origination_size: number;
    preserved_cycles: number;
    proof_of_work_nonce_size: number;
    proof_of_work_threshold: string;
    seed_nonce_revelation_tip: string;
    time_between_blocks: string[];
    tokens_per_roll: string;
};