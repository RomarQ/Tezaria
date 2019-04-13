export interface KeysType {
    encrypted: boolean;
    sk?: string;
    pk?: string;
    pkh: string;
}

export type NonceType = {
    hash: string;
    seedNonceHash: string;
    seed: string;
    level: number;
    revealed: boolean;
};
