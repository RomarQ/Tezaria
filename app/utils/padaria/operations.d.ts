import { KeysType } from './types';

export interface OperationsInterface {
    contractCounters: ContractCounter;
    transactionGasCost: string,
    transactionStorage: string,
    revealGasCost: string;
    revealStorage: string;
    feeDefaults: {
        low: string;
        medium: string;
        high: string;
    };
    // Methods
    transaction: (source:string, destinations:TransactionDestination[], keys:KeysType, fee?:string, gasLimit?:string, storageLimit?:string) => Promise<UnsignedOperationProps>;
    registerDelegate: (keys:KeysType) => Promise<UnsignedOperationProps>;
    sendOperation: (source:string, keys:KeysType, operation:OperationProps[]) => Promise<UnsignedOperationProps>;
    prepareOperations: (source:string, keys:KeysType, operations:OperationProps[]) => Promise<UnsignedOperationProps & {forgedConfirmation: string}>;
    forgeOperationLocally: (operation:OperationProps) => string;
    operationRequiresReveal: (operationType:OperationType) => boolean;
    operationRequiresSource: (operationType:OperationType) => boolean;
    operationRequiresCounter: (operationType:OperationType) => boolean;
};

/* interface Constructor {
    new(): OperationsInterface;
} */

export type ContractCounter = {
    [index: string]: number;
};

export type OperationType =
    | "endorsement"
    | "seed_nonce_revelation"
    | "double_endorsement_evidence"
    | "double_baking_evidence"
    | "activate_account"
    | "proposals"
    | "ballot"
    | "reveal"
    | "transaction"
    | "origination"
    | "delegation";


// TODO: specify correct types
export type UnsignedOperations = [
    UnsignedOperationProps[], // endorsements
    UnsignedOperationProps[], //refused
    UnsignedOperationProps[], //branch_refused
    UnsignedOperationProps[]  //branch_delayed
];

/* // TODO: specify correct types
export type UnsignedOperations = [
    UnsignedOperationProps[], //applied
    UnsignedOperationProps[], //refused
    UnsignedOperationProps[], //branch_refused
    UnsignedOperationProps[]  //branch_delayed
]; */

export type UnsignedOperationProps = {
    protocol?: string;
    branch?: string;
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

export type OperationProps = {
    kind: OperationType;
    source?: string;
    fee?: number | string;
    counter?: number | string;
    gas_limit?: number | string;
    storage_limit?: number | string;
    delegate?: string;
    amount?: number | string;
    destination?: string;
    public_key?: string;
};

export type OperationResult =
    | DelegationOperationResultProps;

export type DelegationOperationResultProps =
    |   {
            status: "applied";
            consumed_gas?: number;
        }
    |   { 
            status: "failed";
            errors: string[];
        }
    |   { 
            status: "skipped";
        }
    |   { 
            status: "backtracked";
            errors?: string[];
            consumed_gas?: number;
        }
    ;


export type TransactionDestination = {
    destination: string;
    amount: string;
    // Not yet implemented
    parameter?:any;
};
