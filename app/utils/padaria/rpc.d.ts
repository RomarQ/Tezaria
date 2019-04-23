import { OperationsInterface, UnsignedOperationProps, OperationProps } from './operations';

export interface RPCInterface {
    ready: boolean;
    nodeAddress: string;
    apiAddress: string;
    network: string;
    networkEpoch: string;
    debug: boolean;
    PowHeader: string;
    networkConstants: NetworkConstants,
    watermark: WaterMarkType;
    uTEZ:   TezosUnitType;
    mTEZ:   TezosUnitType;
    TEZ:    TezosUnitType;
    KTEZ:   TezosUnitType;
    MTEZ:   TezosUnitType;
    setDebugMode: (mode:boolean) => void;
    load: (options:LoadOptions) => Promise<boolean>;
    setCurrentNetwork: () => Promise<void>;
    setNetworkConstants: () => Promise<void>;
    getCurrentHead: () => Promise<BlockProps>;
    getCurrentBlockHeader: () => Promise<BlockProps>;
    queryNode: (path:string, type:QueryType, args?:any) => Promise<any>;
    queryAPI: (path:string, type:QueryType, args?:any) => Promise<any>;
    getBalance: (pkh:string) => Promise<number>;
    simulateOperation: (from:string, keys:KeysType, operation:OperationProps) => Promise<OperationProps[]>;
    forgeOperation: (head:BlockProps, operation:UnsignedOperationProps, skipConfirmation?:boolean) => Promise<UnsignedOperationProps & {forgedConfirmation: string}>;
    preapplyOperations: (operation:UnsignedOperationProps[]) => Promise<UnsignedOperationProps[]>;
    injectOperation: (operation:UnsignedOperationProps) => Promise<UnsignedOperationProps>;
    getManager: (pkh:string) => Promise<{key:string, manager:string}>;
    getCounter: (pkh:string) => Promise<number>;
    getEndorsementOperations: (blockId:string) => Promise<UnsignedOperationProps[]>;
    getPredecessors: (blockHash:string, length:number) => Promise<string[]>;
    getBlock: (blockHash:string) => Promise<BlockProps>;
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

export type BlockProps = {
    chain_id: string;
    hash: string;
    header: BlockHeaderProps;
    metadata: {
        baker: string;
        balance_updates: Array<{
            cycle?: number;
            delegate?: string;
            change: string;
            contract?: string;
            kind: string;
        }>;
        consumed_gas: string;
        deactivated: [];
        level: {
            cycle: number;
            cycle_position: number;
            expected_commitment: boolean;
            level: number;
            level_position: number;
            voting_period: number;
            voting_period_position: number;
        };
        max_block_header_length: number;
        max_operation_data_length: number;
        max_operation_list_length: Array<{ 
            max_op: number;
            max_size: number;
        }>;
        max_operations_ttl: number;
        next_protocol: string;
        nonce_hash: string;
        protocol: string;
        test_chain_status: {
            status: string;
        };
        voting_period_kind: string;
    };
    operations: UnsignedOperations;
    protocol?: string;
}

export type NetworkConstants = {
    block_reward?: string;
    block_security_deposit?: string;
    blocks_per_commitment?: number;
    blocks_per_cycle?: number;
    blocks_per_roll_snapshot?: number;
    blocks_per_voting_period?: number;
    cost_per_byte?: string;
    endorsement_reward?: string;
    endorsement_security_deposit?: string;
    endorsers_per_block?: number;
    hard_gas_limit_per_block?: string;
    hard_gas_limit_per_operation?: string;
    hard_storage_limit_per_operation?: string;
    max_operation_data_length?: number;
    max_proposals_per_delegate?: number;
    max_revelations_per_block?: number;
    michelson_maximum_type_size?: number;
    nonce_length?: number;
    origination_size?: number;
    preserved_cycles?: number;
    proof_of_work_nonce_size?: number;
    proof_of_work_threshold?: string;
    seed_nonce_revelation_tip?: string;
    time_between_blocks?: string[];
    tokens_per_roll?: string;
};