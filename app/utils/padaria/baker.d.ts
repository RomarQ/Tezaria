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

export interface BakerProps {
    //
    // States
    //
    intervalId: number;
    bakedBlocks: any;
    pendingBlocks: any;
    noncesToReveal: NonceType[];
    //
    // Functions
    //
    getCompletedBakings: (pkh:string) => Promise<CompletedBaking[]>;
    getIncomingBakings: (pkh:string) => Promise<IncomingBakings>;

    run: (keys:KeysType, head:HeadType) => void;
    bake: (keys:KeysType, head:HeadType, priority:number, timestamp:string) => Promise<any>;
}