declare module 'bs58check';
declare module 'electron-json-storage';

const enum LogSeverity {
    VERY_HIGH,
    HIGH,
    MEDIUM,
    NORMAL,
    NEUTRAL
};

declare type LogProps = {
    type:       'error' | 'warning' | 'info' | 'success';
    message:    string;
    severity:   LogSeverity;
};

declare type KeysType = {
    encrypted:  boolean;
    sk?:        string;
    pk?:        string;
    pkh:        string;
};

declare type BlockProps = {
    chain_id: string;
    hash: string;
    header: BlockHeaderProps;
    metadata: BlockMetadataProps;
    operations: UnsignedOperations;
    protocol?: string;
}

declare type NonceType = {
    hash:           string;
    seedNonceHash:  string;
    seed:           string;
    level:          number;
    revealed:       boolean;
};

declare type BlockHeaderProps = {
    context: string;
    fitness: string[];
    level: number;
    operations_hash: string;
    predecessor: string
    priority: number;
    proof_of_work_nonce: string;
    proto: number
    signature: string;
    timestamp: string;
    validation_pass: number;
};

declare type BlockMetadataProps = {
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