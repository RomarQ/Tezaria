export interface WaterMarkType {
    blockHeader: Uint8Array;
    endorsement: Uint8Array;
    genericOperation: Uint8Array;
}

export interface TezosUnitProps {
    char: string;
    unit: number;
}

export interface UtilsInterface {
    debug: boolean;
    PowHeader: string;
    watermark: WaterMarkType;
    uTEZ:   TezosUnitType;
    mTEZ:   TezosUnitType;
    TEZ:    TezosUnitType;
    KTEZ:   TezosUnitType;
    MTEZ:   TezosUnitType;

    setDebugMode: (mode:boolean) => void,
    verifyNodeCommits: () => Promise<TezosCommitProps>;
    createProtocolData: (priority:number, powHeader?:string, pow?:string, seed?:string) => string;
    convertUnit: (value:number, to:TezosUnitProps, from?:TezosUnitProps) => string;
    convertUnitWithSymbol: (value:number, to:TezosUnitProps, from?:TezosUnitProps) => string;
    getRewardSharePercentage: (balance:number, staking_balance:number) => number;
    getRewardShare: (balance:number, staking_balance:number, rewards:number) => number;
    getRewardFee: (reward:number, rewardFee:number) => number;
    getTotalRolls: (stakingBalance:number|string) => number;
    parseTEZWithSymbol: (value:number) => string;
    firstCycleLevel: (level:number) => number;
    lastCycleLevel: (level:number) => number;
    hexToBuffer: (hex:string) => Uint8Array;
    bufferToHex: (buffer:Uint8Array) => string;
    mergeBuffers: (Uint8Array, Uint8Array) => Uint8Array;
    b58encode: (payload:Uint8Array, prefix:Uint8Array) => string;
    b58decode: (encoded:string, prefix:Uint8Array) => Uint8Array;
    numberToZarith: (value:number) => string;
}

export interface TezosCommitProps {
    updated: boolean;
    currentCommitHash: string;
    lastCommitHash: string;
    commitsbehind: number;
    author: string;
    date: string;
    message: string;
}
