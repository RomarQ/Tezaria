export interface KeysType {
    encrypted: boolean;
    sk?: string;
    pk?: string;
    pkh: string;
}

export type HeadType = {
    chain_id?: string;
    hash?: string;
    header: {
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
    operations: [
        OperationProps[],
        OperationProps[],
        OperationProps[],
        OperationProps[]
    ];
    protocol?: string;
}

export type NonceType = {
    hash: string;
    seedNonceHash: string;
    seed: string;
    level: number;
    revealed : boolean;
};

export type OperationProps = {
    protocol: string,
    branch: string,
    contents: string,
    signature: string
};

// TODO: specify correct types
export type operationsArrayType = [
    OperationProps[], //applied
    OperationProps[], //refused
    OperationProps[], //branch_refused
    OperationProps[]  //branch_delayed
];