import {
    UnsignedOperations,
    UnsignedOperationProps
} from './operations';

type BakingRight = {
    cycle?: number;
    delegate: string;
    priority: number;
    estimated_time: string;
    level: number;
}

type IncomingBakingsFromServer = {
    current_cycle: number;
    bakings: BakingRight[][];
}

type IncomingBakings = {
    hasData: boolean;
    cycle?: number;
    bakings?: BakingRight[];
}

type CompletedBaking = {
    delegate_pkh: string;
    level: number;
    cycle: number;
    priority: number;
    baked: boolean;
    timestamp: string;
    fees: string;
    reward: string;
}

export interface BakerInterface {
    //
    // States
    //
    injectedBlocks: string[];
    bakedBlocks: number[];
    pendingBlocks: PendingBlock[];
    noncesToReveal: NonceType[];
    levelWaterMark: number;
    //
    // Functions
    //
    getCompletedBakings: (pkh:string) => Promise<CompletedBaking[]>;
    getIncomingBakings: (pkh:string) => Promise<IncomingBakings>;
    levelCompleted: () => void;

    run: (pkh:string, header:BlockHeaderProps, logger: (log:LogProps) => void) => Promise<void>;
    bake: (header:BlockHeaderProps, priority:number, timestamp:string, logger: (log:LogProps) => void) => Promise<{
        timestamp: string;
        data: {
            data: string;
            operations: UnsignedOperationProps[][];
        };
        seed_nonce_hash: string;
        seed: string;
        level: number;
        chain_id: string;
    }>;
}

export type PendingBlock = {
    chain_id: string;
    data: {
        data: string;
        operations: UnsignedOperations;
    }
    level: number;
    seed: string;
    seed_nonce_hash: string;
    timestamp: string;
}