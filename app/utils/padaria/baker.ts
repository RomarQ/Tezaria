/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/camelcase */
import rpc, { QueryTypes } from './rpc'
import Operations from './operations'
import storage from '../storage'
import utils, { Prefix } from './utils'
import crypto from './crypto'

import { LogOrigins, LogSeverity } from './logger'

import { BakerInterface, CompletedBaking, BakingRight } from './baker.d'

const self: BakerInterface = {
  active: false,
  /*
   *   States
   */
  injectedBlocks: [],
  // Will keep the last 5 blocks only
  bakedBlocks: [],
  pendingBlocks: [],
  noncesToReveal: [],
  levelWaterMark: 0,
  //
  // Functions
  //
  getCompletedBakings: async pkh => {
    try {
      const completedBakings: {
        baking_resume: CompletedBaking[]
      } = await rpc.queryAPI(
        `
          query completedBakings($delegate: String!) {
            baking_resume (
              where: {
                delegate_pkh: {_eq: $delegate},
              },
              limit: 50,
              order_by: { level: desc }
            )
            {
              delegate_pkh,
              baked,
              timestamp,
              priority,
              level,
              cycle,
              fees,
              reward
            }
          }
        `,
        { delegate: pkh }
      )

      if (completedBakings && completedBakings.baking_resume) {
        completedBakings.baking_resume.forEach(({ reward, fees }, index) => {
          completedBakings.baking_resume[
            index
          ].reward = utils.parseTEZWithSymbol(Number(reward))

          completedBakings.baking_resume[index].fees = utils.parseTEZWithSymbol(
            Number(fees)
          )
        })

        return completedBakings.baking_resume
      }

      return []
    } catch (e) {
      throw new Error(`Not able to get Completed Bakings - ${e}`)
    }
  },
  getIncomingBakings: async pkh => {
    try {
      const blockMetadata = await rpc.getBlockMetadata('head')

      if (!blockMetadata) {
        return {
          hasData: false,
          bakings: []
        }
      }

      const {
        level: { cycle }
      } = blockMetadata

      let bakingRights: BakingRight[] = []

      for (let i = cycle; i < cycle + 6; i += 1) {
        const rights = (await rpc.queryNode(
          `/chains/main/blocks/head/helpers/baking_rights?delegate=${pkh}&cycle=${i}&max_priority=5`,
          QueryTypes.GET
        )) as BakingRight[]

        console.log(rights)
        if (Array.isArray(rights) && rights.length > 0) {
          bakingRights = [...bakingRights, ...rights]
        }

        if (bakingRights.length > 50) break
      }

      bakingRights = bakingRights.filter(right => !!right.estimated_time)

      return {
        hasData: true,
        cycle,
        bakings: bakingRights
      }
    } catch (e) {
      console.error(e)
    }

    return null
  },
  levelCompleted: () => {
    self.bakedBlocks = [...self.bakedBlocks.slice(1, 5), self.levelWaterMark]
  },
  run: async (pkh, header, logger) => {
    self.levelWaterMark = header.level + 1

    let nonce: NonceProps

    try {
      /*
       *   Check if the block was already baked before
       */
      if (self.bakedBlocks.indexOf(self.levelWaterMark) !== -1) return null

      const bakingRight = await rpc.getBakingRights(pkh, self.levelWaterMark, 5)

      if (!Array.isArray(bakingRight)) {
        self.levelCompleted()
        logger({
          message: 'Not able to get baking rights.',
          type: 'error',
          severity: LogSeverity.VERY_HIGH,
          origin: LogOrigins.BAKER
        })

        return null
      }

      /*
       *   If no baking rights were received, then add level as already baked.
       */
      if (bakingRight.length === 0) {
        self.levelCompleted()
        logger({
          message: `No baking rights found for level ${self.levelWaterMark}.`,
          type: 'info',
          severity: LogSeverity.NEUTRAL,
          origin: LogOrigins.BAKER
        })
        return null
      }

      /*
       *   Wait until is time to bake, but stop if someone already baked this new head
       */
      while (bakingRight[0].level === self.levelWaterMark) {
        /*
         *   Check if is time to bake
         */
        if (Date.now() >= new Date(bakingRight[0].estimated_time).getTime()) {
          logger({
            message: `Baking a block with a priority of [ ${bakingRight[0].priority} ] on level ${bakingRight[0].level}`,
            type: 'info',
            severity: LogSeverity.NEUTRAL,
            origin: LogOrigins.BAKER
          })
          /*
           *   Start baking the block
           */
          const block = await self.bake(
            header,
            bakingRight[0].priority,
            bakingRight[0].estimated_time,
            logger
          )
          /*
           *   Check if the block was successfully baked and inject it
           */
          if (block) {
            logger({
              message: `Block baked at level ${block.level}, in pending state now...`,
              type: 'info',
              severity: LogSeverity.NEUTRAL,
              origin: LogOrigins.BAKER
            })
            /*
             *   Inject the block
             */
            try {
              const blockHash = await rpc.queryNode(
                '/injection/block/?chain=main',
                QueryTypes.POST,
                block.data
              )
              /*
               *   Check if the block failed to be injected
               */
              if (!blockHash) {
                logger({
                  message: 'Inject failed',
                  type: 'error',
                  severity: LogSeverity.HIGH,
                  origin: LogOrigins.BAKER
                })

                break
              }

              self.injectedBlocks.push(blockHash)
              /*
               *   Add nonce if this block was a commitment
               */
              if (block.seed) {
                nonce = {
                  hash: blockHash,
                  seedNonceHash: block.seed_nonce_hash,
                  seed: block.seed,
                  level: block.level
                }
              }

              logger({
                message: `Baked ${blockHash} block at level ${block.level}`,
                type: 'success',
                severity: LogSeverity.HIGH,
                origin: LogOrigins.BAKER
              })
            } catch (e) {
              console.error(e)
            }
          }

          break
        } else {
          /*
           *   Wait a second before trying again
           */
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      self.levelCompleted()
    } catch (e) {
      console.error('error', e)
      self.levelCompleted()
    }

    return nonce
  },

  bake: async (header, priority, timestamp, logger) => {
    let newTimestamp = new Date(timestamp).getTime()

    // Emmy proposal polyfill
    if (rpc.networkConstants.initial_endorsers) {
      const head = await rpc.getCurrentHead()

      const emmyPlusDelay = await rpc.emmyPlusDelay(
        priority,
        await rpc.endorsingPower(head.operations[0])
      )

      console.log('emmyPlusDelay', emmyPlusDelay)

      const diffDelay =
        emmyPlusDelay - Number(rpc.networkConstants.time_between_blocks[0])

      if (diffDelay > 0) {
        newTimestamp += diffDelay * 1000

        // Wait the for the new timestamp
        const delay = newTimestamp - Date.now()
        if (delay > 0) {
          console.error(`Baking delayed ${delay} ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    const operationArgs: {
      seed?: string
      seedHash?: Uint8Array
      nonceHash?: string
      seedHex?: string
    } = {}

    if (
      header.level % Number(rpc.networkConstants.blocks_per_commitment) ===
      0
    ) {
      logger({
        message: `Level ${self.levelWaterMark} is a commitment block, generating a nonce to reveal later.`,
        type: 'info',
        severity: LogSeverity.NEUTRAL,
        origin: LogOrigins.BAKER
      })

      operationArgs.seed = crypto.hexNonce(32)
      operationArgs.seedHash = crypto.seedHash(operationArgs.seed)
      operationArgs.nonceHash = utils.b58encode(
        operationArgs.seedHash,
        Prefix.nce
      )
      operationArgs.seedHex = utils.bufferToHex(operationArgs.seedHash)
    }

    /*
     *   Monitor new endorsings
     *   This is helpful to make sure a block is not built too early
     */
    /*     let endorsements: any[] = []
    rpc.monitorOperations(res => {
      if (Array.isArray(res)) endorsements = [...endorsements, ...res]
    }) */

    /*
     *   Waits for more endorsings if needed
     */
    /*     const endorsementsPerPriority =
      rpc.networkConstants.minimum_endorsements_per_priority
    const delay =
      Number(rpc.networkConstants.delay_per_missing_endorsement || 10) * 1000
    while (Date.now() < new Date(timestamp).getTime() + delay) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    } */

    const pendingOperations = await rpc.getPendingOperations()

    let operations = await Operations.classifyOperations(
      pendingOperations,
      header.protocol
    )

    /*
     *   Dummy signature. [Is not important for this operation]
     */
    const blockHeader: {
      protocol_data: {
        protocol: string
        priority: number
        proof_of_work_nonce: string
        seed_nonce_hash?: string
        signature: string
      }
      operations: UnsignedOperationProps[][]
    } = {
      protocol_data: {
        protocol: header.protocol,
        priority,
        proof_of_work_nonce: '0000000000000000',
        signature:
          'edsigtdv1u5ZbjH4ZTyWsahG1XZeKV64kaZypXqysxvEZtq5L36RAwbQamXmGMJecEiUgb2tQaYk5EXgeuD4Zov6uEa7t7L63f5'
      },
      operations
    }

    operationArgs.nonceHash &&
      (blockHeader.protocol_data.seed_nonce_hash = operationArgs.nonceHash)

    const res = await rpc
      .queryNode(
        `/chains/main/blocks/head/helpers/preapply/block?sort=true&timestamp=${
          newTimestamp / 1000 /* IN SECONDS */
        }`,
        QueryTypes.POST,
        blockHeader
      )
      .catch(error => {
        if (!Array.isArray(error) || !error[0].minimum) {
          logger({
            message: `Failed to preapply block for level ${self.levelWaterMark} -> ${error}`,
            type: 'error',
            severity: LogSeverity.VERY_HIGH,
            origin: LogOrigins.BAKER
          })
        }
      })

    if (!res || !res.shell_header) return null

    const { shell_header, operations: ops } = res as {
      shell_header: { protocol_data: string }
      operations: PendingOperations[]
    }

    shell_header.protocol_data = utils.createProtocolData(priority)

    operations = ops.reduce(
      (prev, cur) =>
        // Hash field is not allowed here, needs to be removed
        [
          ...prev,
          cur.applied.reduce(
            (prev2, { data, branch }) => [
              ...prev2,
              {
                data,
                branch
              }
            ],
            []
          )
        ],
      []
    )

    const { block }: { block: string } = await rpc
      .queryNode(
        '/chains/main/blocks/head/helpers/forge_block_header',
        QueryTypes.POST,
        shell_header
      )
      .catch(error =>
        logger({
          message: `Failed to forge block header for level ${self.levelWaterMark} -> ${error}`,
          type: 'error',
          severity: LogSeverity.VERY_HIGH,
          origin: LogOrigins.BAKER
        })
      )

    if (!block) return null

    const start = Date.now()

    const pow = await crypto.POW(
      block.substring(0, block.length - 22),
      priority,
      operationArgs.seedHex
    )

    const secs = (Date.now() - start) / 1000

    const attemptsRate = (pow.attempt / secs / 1000).toLocaleString(
      'fullwide',
      { maximumFractionDigits: 2 }
    )

    logger({
      message: `POW found in ${pow.attempt} attemps and took ${secs} seconds with a ratio of [${attemptsRate}] Ka/s`,
      type: 'info',
      severity: LogSeverity.NEUTRAL,
      origin: LogOrigins.BAKER
    })

    const signed = crypto.sign(
      pow.blockBytes,
      utils.mergeBuffers(
        utils.watermark.blockHeader,
        utils.b58decode(header.chain_id, Prefix.chainId)
      )
    )

    return {
      timestamp,
      data: {
        data: signed.signedBytes,
        operations
      },
      seed_nonce_hash: operationArgs.seedHex,
      seed: operationArgs.seed,
      level: self.levelWaterMark,
      chain_id: header.chain_id
    }
  }
}

export * from './baker.d'
export default self
