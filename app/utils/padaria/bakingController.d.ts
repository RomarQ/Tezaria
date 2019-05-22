export interface BakingControllerProps {
    delegate: DelegateProps;

    intervalId: number;
    running: boolean;
    baking: boolean;
    endorsing: boolean;
    accusing: boolean;
    rewarding: boolean;
    levelOnStart: number;
    noncesToReveal: NonceType[];
    locked: boolean;
    forcedLock: boolean;
    locks: {
        baker: boolean;
        endorser: boolean;
        accuser: boolean;
        rewarder: boolean;
    }

    load: (keys:KeysType) => Promise<DelegateProps>;
    revealNonces: (header:BlockHeaderProps) => void;
    loadNoncesFromStorage: () => void;
    addNonce: (nonce:NonceType) => void;
    run: (keys:KeysType, logger: (log:LogProps) => void) => void;
    start: (keys: KeysType, options: BakingControllerStartOptions) => Promise<boolean>;
    stop: () => void;
    checkHashPower: () => Promise<number>;
}

declare interface DelegateProps {
    // From Request
    balance?: number | string;
    frozen_balance?: number | string;
    frozen_balance_by_cycle?: {
        cycle: number;
        deposit: number | string;
        fees: number | string;
        rewards: number | string;
    }[];
    staking_balance?: number | string;
    delegated_contracts?: string[];
    delegated_balance?: number | string;
    deactivated?: boolean;
    grace_period?: number;
}

export interface BakingControllerStartOptions {
    baking: boolean;
    endorsing: boolean;
    accusing: boolean;
    rewarding: boolean;
    logger: (log:LogProps) => void;
}

export type BakingControllerState = {
    active?: boolean;
} & BakingControllerStartOptions;
