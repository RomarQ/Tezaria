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