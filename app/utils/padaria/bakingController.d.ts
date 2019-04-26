export interface BakingControllerProps {
    intervalId: number;
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

    revealNonce: (keys:KeysType, head:BlockProps, nonce:NonceType) => Promise<void>;
    revealNonces: (keys:KeysType, head:BlockProps) => void;
    loadNoncesFromStorage: () => void;
    addNonce: (nonce:NonceType) => void;
    run: (keys:KeysType, logger: (log:LogProps) => any) => void;
    start: (keys: KeysType, options: BakingControllerStartOptions) => Promise<boolean>;
    stop: () => void;
    checkHashPower: () => Promise<number>;
}

export type BakingControllerStartOptions = {
    baking: boolean;
    endorsing: boolean;
    accusing: boolean;
    rewarding: boolean;
    logger: (log:LogProps) => any
};

export type BakingControllerState = {
    active?: boolean;
} & BakingControllerStartOptions;