import storage from '../storage'
import rpc, { QueryTypes } from './rpc'
import utils from './utils'
import baker from './baker'
import endorser from './endorser'
import accuser from './accuser'
import rewarder from './rewarder'
import crypto from './crypto'
import operations from './operations'

import {
  BakingControllerProps,
  BakingControllerStartOptions
} from './bakingController.d'

const self: BakingControllerProps = {
  //
  // States
  //
  delegate: {},

  monitoring: false,

  running: false,
  endorsing: false,
  accusing: false,
  levelOnStart: null,
  noncesToReveal: [],
  locked: false,
  locks: {
    endorser: false,
    rewarder: false
  },
  //
  // Functions
  //
  load: async keys => {
    if (!crypto.signer) return self.delegate

    try {
      const manager = await rpc.getManager(keys.pkh)

      self.delegate.revealed = !!manager
      if (!self.delegate.revealed) {
        self.delegate.balance = await rpc.getBalance(keys.pkh)

        /*
         *   Return if balance is not enough to reveal and register as delegate
         *   User can do it himself later
         */
        if (self.delegate.balance < Number(operations.feeDefaults.low) * 2) {
          return self.delegate
        }
      }

      const delegate = await rpc.queryNode(
        `/chains/main/blocks/head/context/delegates/${keys.pkh}`,
        QueryTypes.GET
      )

      if (Array.isArray(delegate)) return self.delegate

      if (delegate) {
        self.delegate = {
          waitingForRights: false,
          ...self.delegate,
          ...delegate
        }

        if (delegate.deactivated) {
          await operations.registerDelegate(keys)
          self.delegate.waitingForRights = true
        }

        return self.delegate
      }
    } catch (e) {
      console.error(e)
    }

    self.delegate.waitingForRights = true
    await operations.registerDelegate(keys)
    return self.delegate
  },
  revealNonces: async header => {
    await self.loadNoncesFromStorage()

    const nonces: NonceProps[] = []

    self.noncesToReveal.forEach(async (nonce: NonceProps) => {
      const revealStart =
        utils.firstCycleLevel(
          nonce.level,
          rpc.networkConstants.blocks_per_cycle
        ) + rpc.networkConstants.blocks_per_cycle
      const revealEnd =
        utils.lastCycleLevel(
          nonce.level,
          rpc.networkConstants.blocks_per_cycle
        ) + rpc.networkConstants.blocks_per_cycle

      console.log(revealStart, nonce.level, revealEnd)

      if (header.level > revealEnd) {
        console.log('Time to Reveal has passed, cycle is OVER!')
        return
      }
      if (header.level >= revealStart) {
        console.log('Revealing nonce ', nonce)
        try {
          await operations.revealNonce(header, nonce)
          return
        } catch (e) {
          console.error(e)
        }
      }

      nonces.push(nonce)
    })

    if (nonces.length !== self.noncesToReveal.length) {
      storage.setBakerNonces(nonces)
    }
  },
  loadNoncesFromStorage: async () => {
    self.noncesToReveal = await storage.getBakerNonces()
  },
  run: async (keys, logger) => {
    if (self.locked || accuser.doubleBaking || !self.delegate) return
    self.locked = true

    const header = await rpc.getBlockHeader('head')

    if (!header) {
      self.locked = false
      return
    }

    self.revealNonces(header)

    /*
     *   On StartUp avoid running the baker at a middle of a block
     */
    if (self.levelOnStart > header.level) {
      console.log('Waiting for the next level...')
      self.locked = false
      return
    }

    // Endorser
    if (self.endorsing) {
      await endorser.run(keys.pkh, header, logger)
    }
    // Baker
    if (baker.active) {
      const nonce = await baker.run(keys.pkh, header, logger)

      if (nonce) {
        storage.setBakerNonces([nonce, ...self.noncesToReveal])
      }
    }
    // Rewarder
    ;(async () => {
      if (rewarder.active && !self.locks.rewarder) {
        self.locks.rewarder = true
        await rewarder.run(keys, logger)
        self.locks.rewarder = false
      }
    })()

    self.locked = false
  },
  start: async (keys: KeysProps, options: BakingControllerStartOptions) => {
    if (!rpc.ready) return false

    baker.active = options.baking
    self.endorsing = options.endorsing
    if (self.accusing !== options.accusing) {
      self.accusing = !self.accusing
      self.accusing ? accuser.run(keys.pkh, options.logger) : accuser.stop()
    }
    rewarder.active = options.rewarding

    /*
     *   Avoid running more than 1 instance
     */
    if (self.running) return true

    self.running = true

    try {
      const header = await rpc.getBlockHeader('head')

      // Stores the current level on Start UP
      if (!self.levelOnStart) {
        self.levelOnStart = header.level + 1
      }
    } catch {
      console.error('Not able to start Baking Service! :(')
    }

    while (self.running) {
      try {
        if (self.monitoring) return true

        self.monitoring = true
        // eslint-disable-next-line no-await-in-loop
        await rpc.monitorHeads('main', (header, resolve) => {
          console.log('Block Received', header)
          try {
            self.running ? self.run(keys, options.logger) : resolve()
          } catch (e) {
            console.error(`[ ERROR while monitoring heads ] - ${e}`)
          }
        })
      } catch (e) {
        console.error(e)
      }
      self.monitoring = false
    }

    return true
  },
  stop: () => {
    self.running = false
    baker.active = false
    self.endorsing = false
    self.accusing = false
    rewarder.active = false
  },
  checkHashPower: () => {
    const tests: number[][] = []
    for (let i = 0; i < 5; i += 1) {
      tests[i] = []
      for (let ii = 0; ii < 131; ii += 1) {
        tests[i].push(Math.floor(Math.random() * 256))
      }
    }
    return new Promise(async (resolve, reject) => {
      const start = Date.now()
      const pows = []
      pows[0] = (await crypto.POW(
        utils.bufferToHex(new Uint8Array(tests[0])),
        0,
        '4e07e55960daee56883d231b3c41f223733f58be90b5a1ee2147df8de5b8ac86'
      )) as any
      pows[1] = (await crypto.POW(
        utils.bufferToHex(new Uint8Array(tests[1])),
        0,
        '4e07e55960daee56883d231b3c41f223733f58be90b5a1ee2147df8de5b8ac86'
      )) as any
      pows[2] = (await crypto.POW(
        utils.bufferToHex(new Uint8Array(tests[2])),
        0,
        '4e07e55960daee56883d231b3c41f223733f58be90b5a1ee2147df8de5b8ac86'
      )) as any
      pows[3] = (await crypto.POW(
        utils.bufferToHex(new Uint8Array(tests[3])),
        0,
        '4e07e55960daee56883d231b3c41f223733f58be90b5a1ee2147df8de5b8ac86'
      )) as any
      pows[4] = (await crypto.POW(
        utils.bufferToHex(new Uint8Array(tests[4])),
        0,
        '4e07e55960daee56883d231b3c41f223733f58be90b5a1ee2147df8de5b8ac86'
      )) as any

      const tPoW = pows.reduce((p, c) => p + c.attempt, 0)
      resolve(
        tPoW / Number(((new Date().getTime() - start) / 1000).toFixed(3)) / 1000
      )
    })
  }
}

export * from './bakingController.d'
export default self
