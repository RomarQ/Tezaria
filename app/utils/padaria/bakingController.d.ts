import { KeysType, HeadType } from './types';

export interface BakingControllerProps {
    intervalId: number;
    baking: boolean;
    endorsing: boolean;
    accusing: boolean;
    levelOnStart: number;
    noncesToReveal: NonceType[];

    revealNonce: (keys:KeysType, head:HeadType, nonce:NonceType) => Promise<void>;
    revealNonces: (keys:KeysType, head:HeadType) => void;
    loadNoncesFromStorage: () => void;
    addNonce: (nonce:NonceType) => void;
    run: (keys:KeysType) => void;
    start: (keys: KeysType, options: BakingControllerStartOptions) => void;
    stop: () => void;
}

export type BakingControllerStartOptions = {
    baking: boolean;
    endorsing: boolean;
    accusing: boolean;
};

export type BakingControllerState = {
    active?: boolean;
} & BakingControllerStartOptions;