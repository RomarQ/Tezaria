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
  getRewardSharePercentage: (balance: number, stakingBalance: number) => number
  getRewardShare: (
    balance: number,
    stakingBalance: number,
    rewards: number
  ) => number
  getRewardFee: (reward: number, rewardFee: number) => number
  getTotalRolls: (
    stakingBalance: number | string,
    tokensPerRoll: number | string
  ) => number
  parseTEZWithSymbol: (value: number) => string
  firstCycleLevel: (level: number, blocksPerCycle: number) => number
  lastCycleLevel: (level: number, blocksPerCycle: number) => number
  hexToBuffer: (hex: string) => Uint8Array
  bufferToHex: (buffer: Uint8Array) => string
  mergeBuffers: (buffer1: Uint8Array, buffer2: Uint8Array) => Uint8Array
  b58encode: (payload: Uint8Array, prefix: Uint8Array) => string
  b58decode: (encoded: string, prefix?: Uint8Array) => Uint8Array
  int32Buffer: (number: number) => Uint8Array
  int16Buffer: (number: number) => Uint8Array
  numberToZarith: (value: number) => string
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
