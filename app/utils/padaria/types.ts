export interface KeysType {
    encrypted: boolean;
    sk?: string;
    pk?: string;
    pkh: string;
}

//
// Baker
//
export interface BakingRight {
    cycle?: number;
    delegate: string;
    priority: number;
    estimated_time: string;
    level: number;
}

export interface IncomingBakingsFromServer {
    current_cycle: number;
    bakings: BakingRight[][];
}

export interface IncomingBakings {
    hasData: boolean;
    cycle?: number;
    bakings?: BakingRight[];
}

export interface CompletedBaking {
    reward?: string;
    level: number;
    cycle: number;
    priority: number;
    missed_priority?: number;
    bake_time: number;
    baked: boolean;
    timestamp: string;
}

export interface CompletedBakingsFromServer extends CompletedBaking {
    block_hash: string;
    baker_hash: {
        tz: string;
        alias?: string;
    };
    distance_level: number;
    fees: number;
}

export interface BakerProps {
    //
    // States
    //
    intervalId: number;
    bakedBlocks: any;
    pendingBlocks: any;
    noncesToReveal: NonceType[];
    //
    // Functions
    //
    getCompletedBakings: (pkh:string) => Promise<CompletedBaking[]>;
    getIncomingBakings: (pkh:string) => Promise<IncomingBakings>;

    run: (keys:KeysType, head:HeadType) => void;
    bake: (keys:KeysType, head:HeadType, priority:number, timestamp:string) => Promise<any>;
}

//
// Baking Controller
//
export interface BakingControllerProps {
    intervalId: number;
    baking: boolean;
    endorsing: boolean;
    accusing: boolean;
    levelOnStart: number;
    noncesToReveal: NonceType[];

    firstCycleLevel: (level:number) => number;
    lastCycleLevel: (level:number) => number;
    revealNonce: (keys:KeysType, head:HeadType, nonce:NonceType) => Promise<void>;
    revealNonces: (keys:KeysType, head:HeadType) => void;
    loadNoncesFromStorage: () => void;
    addNonce: (nonce:NonceType) => void;
    run: (keys:KeysType) => void;
    start: (keys: KeysType, options: BakingControllerStartOptions) => void;
    stop: () => void;
}

export interface BakingControllerStartOptions {
    baking: boolean;
    endorsing: boolean;
    accusing: boolean;
}

export interface BakingControllerState extends BakingControllerStartOptions {
    active?: boolean;
}

export interface NonceType {
    hash: string;
    seedNonceHash: string;
    seed: string;
    level: number;
    revealed : boolean;
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

interface OperationProps {
    protocol: string,
    branch: string,
    contents: string,
    signature: string
}

// TODO: specify correct types
export type operationsArrayType = [
    OperationProps[], //applied
    OperationProps[], //refused
    OperationProps[], //branch_refused
    OperationProps[]  //branch_delayed
]