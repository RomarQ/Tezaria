export interface UtilsInterface {
  debug: boolean
  PowHeader: string
  watermark: WaterMarkType
  uTEZ: TezosUnitProps
  mTEZ: TezosUnitProps
  TEZ: TezosUnitProps
  KTEZ: TezosUnitProps
  MTEZ: TezosUnitProps

  setDebugMode: (mode: boolean) => void
  verifyNodeCommits: () => Promise<TezosCommitProps>
  createProtocolData: (
    priority: number,
    powHeader?: string,
    pow?: string,
    seed?: string
  ) => string
  convertUnit: (
    value: number,
    to: TezosUnitProps,
    from?: TezosUnitProps
  ) => string
  convertUnitWithSymbol: (
    value: number,
    to: TezosUnitProps,
    from?: TezosUnitProps
  ) => string
  getRewardSharePercentage: (balance: number, staking_balance: number) => number
  getRewardShare: (
    balance: number,
    staking_balance: number,
    rewards: number
  ) => number
  getRewardFee: (reward: number, rewardFee: number) => number
  getTotalRolls: (stakingBalance: number | string) => number
  parseTEZWithSymbol: (value: number) => string
  firstCycleLevel: (level: number) => number
  lastCycleLevel: (level: number) => number
  hexToBuffer: (hex: string) => Uint8Array
  bufferToHex: (buffer: Uint8Array) => string
  mergeBuffers: (buffer1: Uint8Array, buffer2: Uint8Array) => Uint8Array
  b58encode: (payload: Uint8Array, prefix: Uint8Array) => string
  b58decode: (encoded: string, prefix?: Uint8Array) => Uint8Array
  int32Buffer: (number: number) => Uint8Array
  int16Buffer: (number: number) => Uint8Array
  numberToZarith: (value: number) => string
  emmyDelay: (priority: number) => number
  emmyPlusDelay: (priority: number, endorsingPower: number) => number
  endorsingPower: (endorsements: EndorsementOperationProps[]) => Promise<number>
}

export interface WaterMarkType {
  blockHeader: Uint8Array
  endorsement: Uint8Array
  genericOperation: Uint8Array
}

export interface TezosUnitProps {
  char: string
  unit: number
}

export interface TezosCommitProps {
  updated: boolean
  currentCommitHash: string
  lastCommitHash: string
  commitsBehind: number
  author: string
  date: string
  message: string
}
