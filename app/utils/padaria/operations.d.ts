export interface OperationsInterface {
    awaitingLock: AwaitingLock;
    awaitingOperations: {
        [source: string]: {
            source: string;
            keys: KeysType;
            operation: OperationProps[];
        }[];
    };

    endorsementsIndex: number;
    votesIndex: number;
    anonymousIndex: number;
    managersIndex: number;
    contractManagers: ContractManager;
    transactionGasCost: string,
    transactionStorage: string,
    delegationGasCost: string,
    delegationStorage: string,
    revealGasCost: string;
    revealStorage: string;
    feeDefaults: {
        low: string;
        medium: string;
        high: string;
    };
    // Methods
    revealNonce: (head: BlockProps, nonce:NonceType) => Promise<UnsignedOperationProps>;
    transaction: (source:string, destinations:TransactionDestination[], keys:KeysType,
        fee?:string, gasLimit?:string, storageLimit?:string, batchSize?:number) => (
            Promise<UnsignedOperationProps[]>
        )
    doubleBakingEvidence: (evidences:BlockHeaderProps[]) => (
        Promise<UnsignedOperationProps>
    )
    doubleEndorsementEvidence: (evidences:EndorsementOperationProps[]) => (
        Promise<UnsignedOperationProps>
    )
    registerDelegate: (keys:KeysType) => Promise<UnsignedOperationProps>;
    activateAccount: (keys:KeysType, secret:string) => Promise<UnsignedOperationProps>;
    awaitForOperationToBeIncluded: (hash:string, prevHeadLevel:number) => Promise<boolean>;
    sendOperation: (source:string, keys:KeysType, operation:OperationProps[]) => (
        Promise<UnsignedOperationProps>
    )
    prepareOperations: (source:string, keys:KeysType, operations:OperationProps[]) => (
        Promise<UnsignedOperationProps & {forgedConfirmation: string}>
    )
    forgeOperationLocally: (operation:OperationProps) => string;
    operationRequiresSource: (operationType:OperationType) => boolean;
    operationRequiresCounter: (operationType:OperationType) => boolean;
    classifyOperations: (operations:UnsignedOperationProps[][], protocol:string) => Promise<UnsignedOperationProps[][]>;
    acceptablePass: (op:{ contents: {kind:string}[] }) => number;
    validationPasses: () => {maxSize:number; maxOp?:number}[];
    sortManagerOperations: (operations:UnsignedOperationProps[], maxSize:number) => UnsignedOperationProps[];
}

export interface AwaitingLock {
    [index: string]: boolean;
}

export interface ContractManager {
    [index: string]: {
        key:string;
        manager:string
    };
}

export type OperationType =
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
    | 'delegation';


export type UnsignedOperations = [
    UnsignedOperationProps[],
    UnsignedOperationProps[],
    UnsignedOperationProps[],
    UnsignedOperationProps[]
]

export interface PendingOperations {
    applied: UnsignedOperationProps[];
    branch_delayed: UnsignedOperationProps[];
    branch_refused?: UnsignedOperationProps[];
    refused?: UnsignedOperationProps[];
    unprocessed: UnsignedOperationProps[];
}

export type UnsignedOperationProps = {
    protocol?: string;
    branch: string;
    contents: OperationContents;
    signature?: string;
    hash?: string;
} & { signedOperationContents?: string };

export type OperationContents = (
    | OperationContentsWithResult[]
);

export type OperationContentsWithResult = {
    metadata?: {
        operation_result: OperationResult;
    }
} & OperationProps;

export interface OperationProps {
    kind: OperationType;
    source?: string;
    fee?: number | string;
    pkh?: string;
    secret?: string;
    counter?: number | string;
    gas_limit?: number | string;
    storage_limit?: number | string;
    delegate?: string;
    amount?: number | string;
    destination?: string;
    public_key?: string;
}

export interface EndorsementOperationProps {
    branch: string;
    operations: {
        kind: OperationType;
        level: number;
        slot: number;
    }[];
    signature: string;
}

export type OperationResult =
    | DelegationOperationResultProps;

export type DelegationOperationResultProps =
    |   {
            status: 'applied';
            consumed_gas?: number;
        }
    |   {
            status: 'failed';
            errors: string[];
        }
    |   {
            status: 'skipped';
        }
    |   {
            status: 'backtracked';
            errors?: string[];
            consumed_gas?: number;
        }

export interface TransactionDestination {
    destination: string;
    amount: string;
    // Not yet implemented
    /* eslint @typescript-eslint/no-explicit-any: ["off"] */
    parameter?:any;
}
