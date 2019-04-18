import { KeysType, BlockProps } from './types';

export interface BakingControllerProps {
    intervalId: number;
    baking: boolean;
    endorsing: boolean;
    accusing: boolean;
    levelOnStart: number;
    noncesToReveal: NonceType[];
    locks: {
        baker: boolean,
        endorser: boolean,
        accuser: boolean
    }

    revealNonce: (keys:KeysType, head:BlockProps, nonce:NonceType) => Promise<void>;
    revealNonces: (keys:KeysType, head:BlockProps) => void;
    loadNoncesFromStorage: () => void;
    addNonce: (nonce:NonceType) => void;
    run: (keys:KeysType) => void;
    start: (keys: KeysType, options: BakingControllerStartOptions) => void;
    stop: () => void;
    checkHashPower: () => Promise<number>;
}

export type BakingControllerStartOptions = {
    baking: boolean;
    endorsing: boolean;
    accusing: boolean;
};

export type BakingControllerState = {
    active?: boolean;
} & BakingControllerStartOptions;