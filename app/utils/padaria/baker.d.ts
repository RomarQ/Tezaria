import { BlockProps } from './rpc';
import { KeysType } from './types';
import { UnsignedOperations } from './operations';

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
    reward?: string;
    level: number;
    cycle: number;
    priority: number;
    missed_priority?: number;
    bake_time: number;
    baked: boolean;
    timestamp: string;
}

type CompletedBakingsFromServer = {
    block_hash: string;
    baker_hash: {
        tz: string;
        alias?: string;
    };
    distance_level: number;
    fees: number;
} & CompletedBaking;

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

    run: (keys:KeysType, head:HeadType) => Promise<void>;
    bake: (keys:KeysType, head:HeadType, priority:number, timestamp:string) => Promise<any>;
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