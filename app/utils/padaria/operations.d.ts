export interface OperationsInterface {
  awaitingLock: AwaitingLock
  awaitingOperations: {
    [source: string]: {
      source: string
      keys: KeysProps
      operation: OperationProps[]
    }[]
  }

  endorsementsIndex: number
  votesIndex: number
  anonymousIndex: number
  managersIndex: number
  contractManagers: ContractManager
  transactionGasCost: string
  transactionStorage: string
  delegationGasCost: string
  delegationStorage: string
  revealGasCost: string
  revealStorage: string
  feeDefaults: {
    low: string
    medium: string
    high: string
  }
  // Methods
  revealNonce: (
    blockId: BlockHeaderProps,
    nonce: NonceProps
  ) => Promise<UnsignedOperationProps>
  endorse: (
    header: BlockHeaderProps,
    slots: number[]
  ) => Promise<UnsignedOperationProps>
  transaction: (
    source: string,
    destinations: TransactionDestination[],
    keys: KeysProps,
    fee?: string,
    gasLimit?: string,
    storageLimit?: string,
    batchSize?: number
  ) => Promise<UnsignedOperationProps[]>
  doubleBakingEvidence: (
    evidences: BlockHeaderProps[]
  ) => Promise<UnsignedOperationProps>
  doubleEndorsementEvidence: (
    evidences: EndorsementOperationProps[]
  ) => Promise<UnsignedOperationProps>
  registerDelegate: (keys: KeysProps) => Promise<UnsignedOperationProps>
  activateAccount: (
    keys: KeysProps,
    secret: string
  ) => Promise<UnsignedOperationProps>
  awaitForOperationToBeIncluded: (
    hash: string,
    prevHeadHash: string
  ) => Promise<boolean>
  sendOperation: (
    source: string,
    keys: KeysProps,
    operation: OperationProps[],
    shouldWait?: boolean,
    skipReveal?: boolean
  ) => Promise<UnsignedOperationProps>
  prepareOperations: (
    source: string,
    keys: KeysProps,
    operations: OperationProps[],
    skipReveal?: boolean
  ) => Promise<UnsignedOperationProps & { forgedConfirmation: string }>
  forgeOperationLocally: (operation: OperationProps) => string
  simulateOperation: (
    from: string,
    keys: KeysProps,
    operation: OperationProps
  ) => Promise<OperationProps[]>
  forgeOperation: (
    head: BlockHeaderProps,
    operation: UnsignedOperationProps,
    verify?: boolean
  ) => Promise<UnsignedOperationProps & { forgedConfirmation: string }>
  preapplyOperations: (
    operation: UnsignedOperationProps[]
  ) => Promise<UnsignedOperationProps[]>
  injectOperation: (
    operation: UnsignedOperationProps
  ) => Promise<UnsignedOperationProps>
  operationRequiresSource: (operationType: OperationType) => boolean
  operationRequiresCounter: (operationType: OperationType) => boolean
  classifyOperations: (
    operations: UnsignedOperationProps[][],
    protocol: string
  ) => Promise<UnsignedOperationProps[][]>
  acceptablePass: (op: { contents: { kind: string }[] }) => number
  validationPasses: () => { maxSize: number; maxOp?: number }[]
  sortManagerOperations: (
    operations: UnsignedOperationProps[],
    maxSize: number
  ) => UnsignedOperationProps[]
}

interface AwaitingLock {
  [index: string]: boolean
}
