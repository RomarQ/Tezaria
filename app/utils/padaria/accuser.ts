import rpc from './rpc'
import operations from './operations'
import bakingController from './bakingController'

import { LogOrigins, LogSeverity } from './logger'

import { AccuserInterface } from './accuser.d'

const self: AccuserInterface = {
  /*
	 *   States
	 */
  running: false,
  // Endorsements seen so far
  endorsements: [],
  // Blocks received so far
  blocks: [],
  preservedLevels: 5,
  // Highest level seen in a block
  highestLevelEncountered: 0,
  /*
	 *   Functions
	 */
  run: async (pkh, logger) => {
    if (self.running) return

    self.running = true
    while (self.running) {
      try {
        await rpc.monitorValidBlocks('main', async (block, resolve) => {
          if (!self.running) {
            return resolve()
          }

          if (block.level > self.highestLevelEncountered) {
            self.highestLevelEncountered = block.level
          }

          self.blocks = await [
            await rpc.getBlock(block.hash),
            ...self.blocks.filter(
              b =>
                b.header.level >
								self.highestLevelEncountered - self.preservedLevels
            )
          ]

          self.blocks.reduce(
            (prev, cur) => {
              const evidenceIndex = prev.findIndex(
                b =>
                  b.header.level == cur.header.level &&
									b.metadata.baker == cur.metadata.baker
              )

              /*
							 *   Double Baking Found
							 */
              if (evidenceIndex !== -1) {
                if (cur.metadata.baker === pkh) {
                  bakingController.forcedLock = true
                  logger({
                    message: `You double baked at level [ ${cur.header.level} ] on blocks [${cur.hash}, ${prev[evidenceIndex].hash}] , shutting down the baker...`,
                    type: 'error',
                    severity: LogSeverity.VERY_HIGH,
                    origin: LogOrigins.ACCUSER
                  })
                } else {
                  logger({
                    message: `Baker ${cur.metadata.baker} double baked at level ${cur.header.level}, accusing now...`,
                    type: 'info',
                    severity: LogSeverity.HIGH,
                    origin: LogOrigins.ACCUSER
                  })

                  operations.doubleBakingEvidence([
                    cur.header,
                    prev[evidenceIndex].header
                  ])
                }

                return [
                  ...prev.slice(0, evidenceIndex),
                  ...prev.slice(evidenceIndex + 1, prev.length)
                ]
              }

              return [cur, ...prev]
            },
						[] as BlockProps[]
          )
        })
      } catch (e) {
        console.error(e)
      }
    }
  },
  stop: () => {
    self.running = false
  }
}

export * from './accuser.d'
export default self
