import rpc, { QueryTypes } from './rpc'
import crypto from './crypto'
import utils, { Prefix } from './utils'
import { OperationsInterface } from './operations.d'

export const MAX_BATCH_SIZE = 200

export const OperationTypes = {
  endorsement: {
    type: 'endorsement' as 'endorsement',
    operationCode: 0
  },
  seed_nonce_revelation: {
    type: 'seed_nonce_revelation' as 'seed_nonce_revelation',
    operationCode: 1
  },
  double_endorsement_evidence: {
    type: 'double_endorsement_evidence' as 'double_endorsement_evidence',
    operationCode: 2
  },
  double_baking_evidence: {
    type: 'double_baking_evidence' as 'double_baking_evidence',
    operationCode: 3
  },
  activate_account: {
    type: 'activate_account' as 'activate_account',
    operationCode: 4
  },
  proposal: {
    type: 'proposal' as 'proposal',
    operationCode: 5
  },
  ballot: {
    type: 'ballot' as 'ballot',
    operationCode: 6
  },
  reveal: {
    type: 'reveal' as 'reveal',
    operationCode: 7
  },
  transaction: {
    type: 'transaction' as 'transaction',
    operationCode: 8
  },
  origination: {
    type: 'origination' as 'origination',
    operationCode: 9
  },
  delegation: {
    type: 'delegation' as 'delegation',
    operationCode: 10
  }
}

const self: OperationsInterface = {
  /*
   *   Locks any operations from the same source while that same source
   *   is waiting for an operation to be included
   */
  awaitingLock: {},
  awaitingOperations: {},
  //
  /*
   *   The index of the different components of the protocol's validation passes *)
   *   TODO: ideally, we would like this to be more abstract and possibly part of
   *   the protocol, while retaining the generality of lists *)
   *   Hypothesis : we suppose [List.length validation_passes = 4]
   */
  endorsementsIndex: 0,
  votesIndex: 1,
  anonymousIndex: 2,
  managersIndex: 3,
  contractManagers: {},
  transactionGasCost: '10600',
  transactionStorage: '300',
  delegationGasCost: '10000',
  delegationStorage: '0',
  revealGasCost: '10000',
  revealStorage: '0',
  feeDefaults: {
    low: '1179',
    medium: '1420',
    high: '3000'
  },
  doubleBakingEvidence: async evidences => {
    const header = await rpc.getBlockHeader('head')

    const operation = {
      branch: header.hash,
      contents: [
        {
          kind: OperationTypes.double_baking_evidence.type,
          bh1: evidences[0],
          bh2: evidences[1]
        }
      ]
    }

    const { forgedConfirmation, ...verifiedOp } = await self.forgeOperation(
      header,
      operation,
      false
    )

    const signed = crypto.sign(
      forgedConfirmation,
      utils.watermark.genericOperation
    )
    return await self.injectOperation({
      ...verifiedOp,
      signature: signed.edsig,
      signedOperationContents: signed.signedBytes
    })
  },
  doubleEndorsementEvidence: async evidences => {
    const header = await rpc.getBlockHeader('head')

    const operation = {
      branch: header.hash,
      contents: [
        {
          kind: OperationTypes.double_endorsement_evidence.type,
          op1: evidences[0],
          op2: evidences[1]
        }
      ]
    }

    const { forgedConfirmation, ...verifiedOp } = await self.forgeOperation(
      header,
      operation,
      false
    )

    const signed = crypto.sign(
      forgedConfirmation,
      utils.watermark.genericOperation
    )
    return await self.injectOperation({
      ...verifiedOp,
      signature: signed.edsig,
      signedOperationContents: signed.signedBytes
    })
  },
  revealNonce: async (header, nonce) => {
    const operation = {
      branch: header.hash,
      contents: [
        {
          kind: OperationTypes.seed_nonce_revelation.type,
          level: nonce.level,
          nonce: nonce.seed
        }
      ]
    }

    const { forgedConfirmation, ...verifiedOp } = await self.forgeOperation(
      header,
      operation,
      true
    )

    const signed = crypto.sign(
      forgedConfirmation,
      utils.watermark.genericOperation
    )
    return self.injectOperation({
      ...verifiedOp,
      signature: signed.edsig,
      signedOperationContents: signed.signedBytes
    })
  },
  endorse: async (header, slots) => {
    const operation = {
      branch: header.hash,
      contents: [
        {
          kind: OperationTypes.endorsement.type,
          level: header.level
        }
      ]
    } as any

    //  Polyfill for proposal "emmy"
    rpc.networkConstants['minimum_endorsements_per_priority'] &&
      (operation.contents[0].slot = slots[0])

    const { forgedConfirmation, ...verifiedOp } = await self.forgeOperation(
      header,
      operation
    )

    const signed = crypto.sign(
      forgedConfirmation,
      utils.mergeBuffers(
        utils.watermark.endorsement,
        utils.b58decode(header.chain_id, Prefix.chainId)
      )
    )

    return self.injectOperation({
      ...verifiedOp,
      signature: signed.edsig,
      signedOperationContents: signed.signedBytes
    })
  },
  transaction: async (
    source,
    destinations,
    keys,
    fee = self.feeDefaults.medium,
    gasLimit = self.transactionGasCost,
    storageLimit = self.transactionStorage,
    batchSize = MAX_BATCH_SIZE
  ) => {
    if (batchSize > MAX_BATCH_SIZE) batchSize = MAX_BATCH_SIZE

    const operations = destinations.reduce(
      (prev, cur) => {
        if (prev[prev.length - 1].length === batchSize) {
          return [
            ...prev,
            [
              {
                kind: OperationTypes.transaction.type,
                fee: String(fee),
                gas_limit: String(gasLimit),
                storage_limit: String(storageLimit),
                amount: String(cur.amount),
                destination: cur.destination
              }
            ]
          ]
        }

        prev[prev.length - 1].push({
          kind: OperationTypes.transaction.type,
          fee: String(fee),
          gas_limit: String(gasLimit),
          storage_limit: String(storageLimit),
          amount: String(cur.amount),
          destination: cur.destination
        })

        return prev
      },
      [[]]
    )

    const ops = []
    for (const batch of operations) {
      const op = await self.sendOperation(source, keys, batch, true)
      // The result operation hash needs to be a string, otherwise is a error
      if (op && typeof op.hash !== 'string') {
        console.error('Operation Failed', op)
        continue
      }

      ops.push(op)
    }
    return ops
  },
  registerDelegate: keys => {
    const operation = {
      kind: OperationTypes.delegation.type,
      fee: String(self.feeDefaults.low),
      gas_limit: String(self.delegationGasCost),
      storage_limit: String(self.delegationStorage),
      delegate: keys.pkh
    }
    console.log('1')
    return self.sendOperation(keys.pkh, keys, [operation], true)
  },
  activateAccount: (keys, secret) => {
    const operation = {
      kind: OperationTypes.activate_account.type,
      secret,
      pkh: keys.pkh
    }
    return self.sendOperation(keys.pkh, keys, [operation], true, true)
  },
  awaitForOperationToBeIncluded: async (opHash, prevHeadHash) => {
    // Wait 5 seconds before checking if the operation was inlcuded
    await new Promise(resolve => setTimeout(resolve, 5000))

    const headHash = await rpc.getBlockHash('head')
    const operations = await rpc.getBlockOperations('head')
    if (prevHeadHash === headHash) {
      return await self.awaitForOperationToBeIncluded(opHash, prevHeadHash)
    }

    for (const opCollection of operations) {
      for (const op of opCollection) {
        if (op.hash === opHash) return true
      }
    }

    return await self.awaitForOperationToBeIncluded(opHash, headHash)
  },
  sendOperation: async (
    source,
    keys,
    operation,
    shouldWait = false,
    skipReveal = false
  ) => {
    while (true) {
      // Wait for operation turn
      if (self.awaitingLock[source]) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }
      // Cannot run more than one counter operation from the same source at the same time,
      // otherwise the next operation will be rejected because counter will be too high
      self.awaitingLock[source] = true

      try {
        const preparedOp = await self.prepareOperations(
          source,
          keys,
          operation,
          skipReveal
        )

        if (!preparedOp) return

        const { forgedConfirmation, ...verifiedOp } = preparedOp

        const signed = crypto.sign(
          forgedConfirmation,
          utils.watermark.genericOperation
        )

        const injectedOp = await self.injectOperation({
          ...verifiedOp,
          signature: signed.edsig,
          signedOperationContents: signed.signedBytes
        })

        if (!injectedOp || typeof injectedOp.hash !== 'string') {
          console.error('Error -> ', injectedOp)
          self.awaitingLock[source] = false
          continue
        }

        console.log(injectedOp)
        // Wait for operation to be included
        if (shouldWait) {
          await self.awaitForOperationToBeIncluded(injectedOp.hash, '')
        }

        self.awaitingLock[source] = false
        return injectedOp
      } catch (e) {
        console.error(e)
      }

      self.awaitingLock[source] = false
      return
    }
  },
  prepareOperations: async (source, keys, operations, skipReveal = false) => {
    const header = await rpc.getBlockHeader('head')

    if (!self.contractManagers[source]) {
      self.contractManagers[source] = await rpc.getManager(source)
    }

    let counter = await rpc.getCounter(source)
    /*
     *   Prepare reveal operation if required
     */
    if (!self.contractManagers[source].key && !skipReveal) {
      operations = [
        {
          kind: OperationTypes.reveal.type,
          fee: String(self.feeDefaults.low),
          public_key: keys.pk,
          source,
          gas_limit: String(self.revealGasCost),
          storage_limit: String(self.revealStorage)
        },
        ...operations
      ]
    }

    operations.forEach(op => {
      if (self.operationRequiresSource(op.kind)) {
        if (!op.source) op.source = source
      }
      if (self.operationRequiresCounter(op.kind)) {
        if (!op.gas_limit) op.gas_limit = String(0)
        if (!op.storage_limit) op.storage_limit = String(0)
        op.counter = String(++counter)
      }
    })

    console.log(operations)

    return self.forgeOperation(header, {
      branch: header.hash,
      contents: operations
    })
  },
  forgeOperationLocally: (operation: OperationProps) => {
    let forgeResult = utils.bufferToHex(
      new Uint8Array([OperationTypes[operation.kind].operationCode])
    )

    if (operation.source) {
      const cleanedSource = utils.bufferToHex(
        utils.b58decode(operation.source, Prefix.tz1)
      )
      if (cleanedSource.length > 44) {
        // must be less or equal 44 bytes
        throw new Error('provided source is invalid')
      }

      if (cleanedSource.length % 44 > 0) {
        forgeResult +=
          '0'.repeat(44 - (cleanedSource.length % 44)) + cleanedSource
      }
    }

    typeof operation.fee !== 'undefined' &&
      (forgeResult += utils.numberToZarith(Number(operation.fee)))

    typeof operation.counter !== 'undefined' &&
      (forgeResult += utils.numberToZarith(Number(operation.counter)))

    typeof operation.gas_limit !== 'undefined' &&
      (forgeResult += utils.numberToZarith(Number(operation.gas_limit)))

    typeof operation.storage_limit !== 'undefined' &&
      (forgeResult += utils.numberToZarith(Number(operation.storage_limit)))

    switch (OperationTypes[operation.kind].operationCode) {
      case 0: // Endorsement
        typeof operation.slot !== 'undefined' &&
          (forgeResult += utils.bufferToHex(new Uint8Array([operation.slot])))

        forgeResult += utils.bufferToHex(
          utils.int32Buffer(Number(operation.level))
        )
        break
      case 1:
        forgeResult +=
          utils.bufferToHex(utils.int32Buffer(Number(operation.level))) +
          operation.nonce
        break
      case 2:
        break
      case 3:
        forgeResult += '000000ce'
        forgeResult += `${utils.bufferToHex(
          utils.int32Buffer(Number(operation.bh1.level))
        )}`
        forgeResult += `${utils.bufferToHex(
          new Uint8Array([Number(operation.bh1.proto)])
        )}`
        forgeResult += `${utils.bufferToHex(
          utils.b58decode(operation.bh1.predecessor, Prefix.block)
        )}`
        forgeResult += '00000000'
        forgeResult += Math.floor(
          new Date(operation.bh1.timestamp).getTime() / 1000
        ).toString(16)
        forgeResult += `${utils.bufferToHex(
          new Uint8Array([Number(operation.bh1.validation_pass)])
        )}`
        forgeResult += `${utils.bufferToHex(
          utils.b58decode(operation.bh1.operations_hash, Prefix.LLo)
        )}`
        forgeResult += '00000011000000010000000008'
        forgeResult += `${operation.bh1.fitness[1]}`
        forgeResult += `${utils.bufferToHex(
          utils.b58decode(operation.bh1.context, Prefix.Co)
        )}`
        forgeResult += `00${utils.bufferToHex(
          new Uint8Array([operation.bh1.priority])
        )}`
        forgeResult += `${operation.bh1.proof_of_work_nonce}`
        operation.bh1.seed_nonce_hash &&
          (forgeResult += `|${utils.bufferToHex(
            utils.b58decode(operation.bh1.seed_nonce_hash, Prefix.nce)
          )}`)
        forgeResult += `00${utils.bufferToHex(
          utils.b58decode(operation.bh1.signature, Prefix.sig)
        )}`

        forgeResult += '000000ce'
        forgeResult += `${utils.bufferToHex(
          utils.int32Buffer(Number(operation.bh2.level))
        )}`
        forgeResult += `${utils.bufferToHex(
          new Uint8Array([Number(operation.bh2.proto)])
        )}`
        forgeResult += `${utils.bufferToHex(
          utils.b58decode(operation.bh2.predecessor, Prefix.block)
        )}`
        forgeResult += '00000000'
        forgeResult += Math.floor(
          new Date(operation.bh2.timestamp).getTime() / 1000
        ).toString(16)
        forgeResult += `${utils.bufferToHex(
          new Uint8Array([Number(operation.bh2.validation_pass)])
        )}`
        forgeResult += `${utils.bufferToHex(
          utils.b58decode(operation.bh2.operations_hash, Prefix.LLo)
        )}`
        forgeResult += '00000011000000010000000008'
        forgeResult += `${operation.bh2.fitness[1]}`
        forgeResult += `${utils.bufferToHex(
          utils.b58decode(operation.bh2.context, Prefix.Co)
        )}`
        forgeResult += `00${utils.bufferToHex(
          new Uint8Array([operation.bh2.priority])
        )}`
        forgeResult += `${operation.bh2.proof_of_work_nonce}`
        operation.bh2.seed_nonce_hash &&
          (forgeResult += `|${utils.bufferToHex(
            utils.b58decode(operation.bh2.seed_nonce_hash, Prefix.nce)
          )}`)
        forgeResult += `00${utils.bufferToHex(
          utils.b58decode(operation.bh2.signature, Prefix.sig)
        )}`
        break
      case 4: // Activate Account
        forgeResult +=
          utils.bufferToHex(utils.b58decode(operation.pkh, Prefix.tz1)) +
          operation.secret
        break
      case 5:
        break
      case 6:
        break
      case 7: // Reveal
        forgeResult += `00${utils.bufferToHex(
          utils.b58decode(operation.public_key, Prefix.edpk)
        )}`
        break
      case 8: // Transaction
        forgeResult += utils.numberToZarith(Number(operation.amount))

        let cleanedDestination = ''
        if (operation.destination.toLowerCase().startsWith('kt')) {
          cleanedDestination = `01${utils.bufferToHex(
            utils.b58decode(operation.destination, Prefix.kt)
          )}00`
        } else {
          cleanedDestination = utils.bufferToHex(
            utils.b58decode(operation.destination, Prefix.tz1)
          )
        }

        if (cleanedDestination.length % 44 > 0) {
          cleanedDestination =
            '0'.repeat(44 - (cleanedDestination.length % 44)) +
            cleanedDestination
        }

        forgeResult += `${cleanedDestination}00`
        break
      case 9:
        break
      case 10: // Delegation
        forgeResult += `ff00${utils.bufferToHex(
          utils.b58decode(operation.delegate, Prefix.tz1)
        )}`
        break
    }
    return forgeResult
  },
  simulateOperation: async (from, keys, operation) => {
    const { forgedConfirmation, ...verifiedOp } = await self.prepareOperations(
      from,
      keys,
      [operation]
    )

    return await rpc.queryNode(
      '/chains/main/blocks/head/helpers/scripts/run_operation',
      QueryTypes.POST,
      verifiedOp
    )
  },
  forgeOperation: async (metadata, operation, verify = true) => {
    const forgedOperation = await rpc.queryNode(
      '/chains/main/blocks/head/helpers/forge/operations',
      QueryTypes.POST,
      operation
    )

    if (!forgedOperation) return

    const forgedConfirmation = operation.contents.reduce(
      (prev, cur) => (prev += self.forgeOperationLocally(cur)),
      utils.bufferToHex(utils.b58decode(operation.branch, Prefix.blockHash))
    )

    if (forgedOperation !== forgedConfirmation) {
      console.log(forgedOperation)
      console.log(forgedConfirmation)

      if (verify) {
        throw Error('[RPC] - Validation error on operation forge verification.')
      }
    }

    return {
      ...operation,
      protocol: metadata.protocol,
      forgedConfirmation: forgedOperation
    }
  },
  preapplyOperations: async operations => {
    const preappliedOps = (await rpc.queryNode(
      '/chains/main/blocks/head/helpers/preapply/operations',
      QueryTypes.POST,
      operations
    )) as UnsignedOperationProps[]

    if (!Array.isArray(preappliedOps)) {
      throw new Error('[RPC] - Error on preapplying operations.')
    }

    if (
      preappliedOps.some(
        ({ contents }) =>
          contents &&
          contents.some(
            ({ metadata: { operation_result } }) =>
              operation_result && operation_result.status === 'failed'
          )
      )
    ) {
      console.error(preappliedOps)
      throw new Error('[RPC] - Failed to preapply operations')
    }

    return preappliedOps
  },
  injectOperation: async ({ signedOperationContents, ...rest }) => {
    const [preappliedOp] = await self.preapplyOperations([rest])
    const operationHash = (await rpc.queryNode(
      '/injection/operation',
      QueryTypes.POST,
      signedOperationContents
    )) as string

    return {
      hash: operationHash,
      ...preappliedOp
    }
  },
  /*
   *   We classify operations, sort managers operation by interest and add bad ones at the end
   *   Hypothesis : we suppose that the received manager operations have a valid gas_limit
   *   [classify_operations] classify the operation in 4 lists indexed as such :
   *       - 0 -> Endorsements
   *       - 1 -> Votes and proposals
   *       - 2 -> Anonymous operations
   *       - 3 -> High-priority manager operations.
   *       Returns two list :
   *       - A desired set of operations to be included
   *       - Potentially overflowing operations
   */
  classifyOperations: async (operations, protocol) => {
    const liveBlocks = (await rpc.queryNode(
      '/chains/main/blocks/head/live_blocks',
      QueryTypes.GET
    )) as string[]

    // Remove operations that are too old
    operations = operations.map(operationsType =>
      operationsType.filter(({ branch }: { branch: string }) =>
        liveBlocks.includes(branch)
      )
    )

    // Prepare Operations
    const validationPasses = self.validationPasses()
    const operationsList: UnsignedOperationProps[][] = []
    for (let i = 0; i < validationPasses.length; i++) {
      operationsList.push([] as UnsignedOperationProps[])
    }

    operations.forEach(operationsType => {
      operationsType.forEach((op: UnsignedOperationProps) => {
        op.protocol = protocol
        delete op.hash
        const pass = self.acceptablePass(op)
        operationsList[pass] = [...operationsList[pass], op]
      })
    })

    const managerOperations = operationsList[self.managersIndex]
    const managerOpsMaxSize = validationPasses[self.managersIndex].maxSize

    // @TODO: sort_manager_operations

    return operationsList
  },
  /*
   *   Sort operation consisdering potential gas and storage usage.
   *   Weight = fee / (max ( (size/size_total), (gas/gas_total)))
   */
  sortManagerOperations: (operations, maxSize) => {
    // https://gitlab.com/tezos/tezos/blob/07b47c09cc4a245252f1e75ffbe789aa8767f7fb/src/proto_alpha/lib_delegate/client_baking_forge.ml
    const computeWeight = (
      op: UnsignedOperationProps,
      fee: number,
      gas: number
    ): number => {
      const size = op.contents.reduce(
        (prev, cur) => (prev += self.forgeOperationLocally(cur)),
        utils.bufferToHex(utils.b58decode(op.branch, Prefix.blockHash))
      ).length

      return (
        fee /
        Math.max(
          size / maxSize,
          gas / Number(rpc.networkConstants.hard_gas_limit_per_block)
        )
      )
    }

    return operations
  },
  acceptablePass: op => {
    if (!op || !op.contents) return 3

    switch (op.contents[0].kind) {
      case OperationTypes.endorsement.type:
        return 0
      case OperationTypes.ballot.type || OperationTypes.proposal.type:
        return 1
      case OperationTypes.activate_account.type:
        return 2
      case OperationTypes.double_baking_evidence.type:
        return 2
      case OperationTypes.double_endorsement_evidence.type:
        return 2
      case OperationTypes.seed_nonce_revelation.type:
        return 2
      default:
        return 3
    }
  },
  validationPasses: () => {
    // Allow 100 wallet activations or denunciations per block
    const maxAnonymousOps = rpc.networkConstants.max_revelations_per_block + 100
    return [
      {
        maxSize: 32 * 1024,
        maxOp: 32
      }, // 32 endorsements
      { maxSize: 32 * 1024 }, // 32k of voting operations
      {
        maxSize: maxAnonymousOps * 1024,
        maxOp: maxAnonymousOps
      },
      { maxSize: 512 * 1024 } // 512kB
    ]
  },
  operationRequiresSource: (operationType: OperationType) =>
    [
      'reveal',
      'proposals',
      'ballot',
      'transaction',
      'origination',
      'delegation'
    ].includes(operationType),
  operationRequiresCounter: (operationType: OperationType) =>
    ['reveal', 'transaction', 'origination', 'delegation'].includes(
      operationType
    )
}

export * from './operations.d'
export default self
