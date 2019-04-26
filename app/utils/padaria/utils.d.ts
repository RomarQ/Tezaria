import { OperationProps } from './rpc';

export type WaterMarkType = {
    blockHeader: Uint8Array;
    endorsement: Uint8Array;
    genericOperation: Uint8Array;
}

export type TezosUnitType = {
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
    verifyNodeCommits: () => Promise<CommitState>;
    operationType: (op:{ contents: {kind:string}[] }) => number;
    createProtocolData: (priority:number, powHeader?:string, pow?:string, seed?:string) => string;
    convertUnit: (value:number, to:{char:string, unit:number}, from?:{char:string, unit:number}) => string;
    convertUnitWithSymbol: (value:number, to:{char:string, unit:number}, from?:{char:string, unit:number}) => string;
    getRewardSharePercentage: (balance:number, staking_balance:number) => number;
    getRewardShare: (balance:number, staking_balance:number, rewards:number) => number;
    getRewardFee: (reward:number, rewardFee:number) => number;
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

export type TezosCommitState = {
    updated: boolean;
    currentCommitHash: string;
    lastCommitHash: string;
    commitsbehind: number;
    author: string;
    date: string;
    message: string;
}