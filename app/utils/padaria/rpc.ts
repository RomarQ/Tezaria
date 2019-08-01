import https from 'https'
import http from 'http'
import { GraphQLClient } from 'graphql-request'

import config from './baker-config.json'
import { RPCInterface, NetworkConstants } from './rpc.d'

export enum QueryTypes {
  GET = 'GET',
  POST = 'POST'
}

const self: RPCInterface = {
  ready: false,
  nodeAddress: (config as any).defaultNodeAddress,
  nodePort: (config as any).defaultNodePort,
  apiAddress: (config as any).defaultApiAddress,
  apiClient: null,
  network: '',
  networkEpoch: '',
  networkConstants: {},
  load: async options => {
    options.nodeAddress && (self.nodeAddress = options.nodeAddress)
    options.nodePort && (self.nodePort = options.nodePort)
    options.rewardsBatchSize &&
      ((config as any).paymentsBatchSize = options.rewardsBatchSize)
    options.delegatorFee &&
      ((config as any).feePercentage = options.delegatorFee)

    if (options.apiAddress) {
      self.apiAddress = options.apiAddress
      self.apiClient = new GraphQLClient(options.apiAddress)
    }

    await self.setNetworkConstants()
    await self.setCurrentNetwork()
    await self.verifyNodeCommits()

    self.ready = true

    return self.ready
  },
  setCurrentNetwork: async () => {
    const versions = (await self.queryNode(
      '/network/versions',
      QueryTypes.GET
    )) as [{ chain_name: string }] | void

    if (versions && versions[0].chain_name) {
      /* This will parse the network name
       *
       *  <versions string format> : "TEZOS_<network>_<networkEpoch>"
       */
      const networkInfo = versions[0].chain_name.split('_')
      // eslint-disable-next-line prefer-destructuring
      self.network = networkInfo[1]
      // eslint-disable-next-line prefer-destructuring
      self.networkEpoch = networkInfo[2]

      return
    }
    throw Error('Cannot get the current tezos Network.')
  },
  setNetworkConstants: async () => {
    self.networkConstants = (await self.queryNode(
      '/chains/main/blocks/head/context/constants',
      QueryTypes.GET
    )) as NetworkConstants
  },
  getCurrentLevel: (chainId = 'main', blockId = 'head') =>
    self.queryNode(
      `/chains/${chainId}/blocks/${blockId}/helpers/current_level`,
      QueryTypes.GET
    ),
  getCurrentCycle: async (chainId = 'main', blockId = 'head') => {
    const { level } = await self.getCurrentLevel(chainId, blockId)

    return level && Math.floor(level / self.networkConstants.blocks_per_cycle)
  },
  getCurrentHead: () =>
    self.queryNode('/chains/main/blocks/head', QueryTypes.GET),
  getBlockHash: blockId =>
    self.queryNode(`/chains/main/blocks/${blockId}/hash`, QueryTypes.GET),
  getBlockHeader: blockId =>
    self.queryNode(`/chains/main/blocks/${blockId}/header`, QueryTypes.GET),
  getBlockMetadata: blockId =>
    self.queryNode(`/chains/main/blocks/${blockId}/metadata`, QueryTypes.GET),
  getBlockOperations: blockId =>
    self.queryNode(`/chains/main/blocks/${blockId}/operations`, QueryTypes.GET),
  getBakingRights: (
    pkh,
    level,
    maxPriority = 5,
    chainId = 'main',
    blockId = 'head'
  ) =>
    pkh
      ? self.queryNode(
          `/chains/${chainId}/blocks/${blockId}/helpers/baking_rights?delegate=${pkh}&level=${level}&max_priority=${maxPriority}`,
          QueryTypes.GET
        )
      : self.queryNode(
          `/chains/${chainId}/blocks/${blockId}/helpers/baking_rights?level=${level}&max_priority=${maxPriority}`,
          QueryTypes.GET
        ),
  queryNode: (path, method, args) => {
    const options = {
      hostname: self.nodeAddress,
      port: self.nodePort,
      timeout: 3000, // 3 secs
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    return self.queryRequest(options, args)
  },
  // GraphQL
  queryAPI: (query, variables) => {
    if (!self.apiClient) throw Error('API configuration missing!')

    return variables
      ? self.apiClient.request(query, variables)
      : self.apiClient.request(query)
  },
  /*
   *   All paths that contain parameters need to include / before the ?
   *   (for example: https://address/.../?parameter=xyz)
   */

  queryRequest: (options, args) =>
    new Promise((resolve, reject) => {
      try {
        let req
        if (options.port === 443) {
          req = https.request(options, res => {
            res.setEncoding('utf8')
            let result = ''

            res.on('data', chunk => {
              result += chunk
            })

            res.on('end', () => {
              try {
                if (res.statusCode === 200) return resolve(JSON.parse(result))

                reject(new Error(result))
              } catch (e) {
                reject(new Error(e))
              }
              return null
            })
          })
        } else {
          req = http.request(options, res => {
            res.setEncoding('utf8')
            let result = ''

            res.on('data', chunk => {
              result += chunk
            })

            res.on('end', () => {
              try {
                if (res.statusCode === 200) return resolve(JSON.parse(result))

                reject(new Error(result))
              } catch (e) {
                console.log(result)
                reject(new Error(e))
              }
              return null
            })
          })
        }

        req.on('error', e => {
          reject(e)
        })

        if (options.method === QueryTypes.POST) {
          req.write(JSON.stringify(args))
        }

        req.end()
      } catch (e) {
        reject(new Error(e))
      }
    }),
  queryStreamRequest: (options, cb) =>
    new Promise((resolve, reject) => {
      try {
        let req
        if (options.port === 443) {
          req = https.request(options, res => {
            res.setEncoding('utf8')
            let result = ''

            res.on('data', chunk => {
              try {
                result += chunk
                cb(JSON.parse(result), resolve)
                result = ''
              } catch (e) {
                // Expected to receive exeptions when the json response is not yet complete, the response is being sent in chunks
              }
            })

            res.on('end', () => resolve())
          })
        } else {
          req = http.request(options, res => {
            res.setEncoding('utf8')
            let result = ''

            res.on('data', chunk => {
              try {
                result += chunk
                cb(JSON.parse(result), resolve)
                result = ''
              } catch (e) {
                // Expected to receive exeptions when the json response is not yet complete, the response is being sent in chunks
              }
            })

            res.on('end', () => resolve())
          })
        }

        req.on('error', e => {
          reject(e)
        })

        req.end()
      } catch (e) {
        reject(new Error(e))
      }
    }),
  getContract: pkh =>
    self.queryNode(
      `/chains/main/blocks/head/context/contracts/${pkh}`,
      QueryTypes.GET
    ),
  getCounter: async pkh =>
    Number(
      await self.queryNode(
        `/chains/main/blocks/head/context/contracts/${pkh}/counter`,
        QueryTypes.GET
      )
    ),
  getManager: contract =>
    self.queryNode(
      `/chains/main/blocks/head/context/contracts/${contract}/manager_key`,
      QueryTypes.GET
    ),
  getBalance: async pkh =>
    Number(
      await self.queryNode(
        `/chains/main/blocks/head/context/contracts/${pkh}/balance`,
        QueryTypes.GET
      )
    ),
  monitorOperations: callback => {
    const options = {
      hostname: self.nodeAddress,
      port: self.nodePort,
      path: '/chains/main/mempool/monitor_operations',
      method: QueryTypes.GET,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    return self.queryStreamRequest(options, callback)
  },
  monitorHeads: (chainId, callback) => {
    const options = {
      hostname: self.nodeAddress,
      port: self.nodePort,
      path: `/monitor/heads/${chainId}`,
      method: QueryTypes.GET,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    return self.queryStreamRequest(options, callback)
  },
  monitorValidBlocks: (chainId, callback) => {
    const options = {
      hostname: self.nodeAddress,
      port: self.nodePort,
      path: `/monitor/valid_blocks/?chain=${chainId}`,
      method: QueryTypes.GET,
      headers: {
        'Content-Type': 'application/json'
      }
    } as any
    options.agent =
      self.nodePort === 443 ? new https.Agent(options) : new http.Agent(options)

    return self.queryStreamRequest(options, callback)
  },
  verifyNodeCommits: async () => {
    const nodeLastCommit = await self.queryNode(
      '/monitor/commit_hash',
      QueryTypes.GET
    )
    const options = {
      hostname: 'gitlab.com',
      port: 443,
      path: `/api/v4/projects/tezos%2Ftezos/repository/commits/?ref_name=${self.network.toLocaleLowerCase()}&per_page=100`,
      method: 'GET'
    }
    const commits = (await self.queryRequest(options)) as {
      id: string
      author_name: string
      committed_date: string
      parent_ids: string[]
      message: string
    }[]

    if (!Array.isArray(commits)) return null

    return new Promise(resolve => {
      let index = 0
      commits.forEach(commit => {
        if (
          commit.id === nodeLastCommit ||
          commit.parent_ids.some(id => id === nodeLastCommit)
        ) {
          resolve({
            updated: index === 0,
            currentCommitHash: nodeLastCommit,
            lastCommitHash: commit.id,
            commitsBehind: index,
            author: commit.author_name,
            date: commit.committed_date,
            message: commit.message
          })
        }
        index += 1
      })
      resolve(null)
    })
  },
  getPendingOperations: async () => {
    const pendingOperations = (await self.queryNode(
      '/chains/main/mempool/pending_operations',
      QueryTypes.GET
    )) as PendingOperations

    if (!pendingOperations) return null

    pendingOperations.branch_delayed.map(op => op[1])
    pendingOperations.unprocessed.map(op => op[1])

    // Only retain the applied, unprocessed and delayed operations
    delete pendingOperations.branch_refused
    delete pendingOperations.refused

    return Object.keys(pendingOperations).map(type => pendingOperations[type])
  },
  getEndorsementOperations: async blockId => {
    const operations = (await self.queryNode(
      `/chains/main/blocks/${blockId}/operations`,
      QueryTypes.GET
    )) as UnsignedOperationProps[][]

    return Array.isArray(operations) && operations.length ? operations[0] : []
  },
  getEndorsingPower: (chainID = 'main', endorsementOp) =>
    self.queryNode(
      `/chains/${chainID}/blocks/${endorsementOp.branch}/endorsing_power`,
      QueryTypes.POST,
      endorsementOp
    ),
  getPredecessors: async (blockHash, length) => {
    const res = (await self.queryNode(
      `/chains/main/blocks/?head=${blockHash}&length=${length}`,
      QueryTypes.GET
    )) as string[][]

    return Array.isArray(res) && res.length > 0 ? res[0] : []
  },
  getBlock: blockHash =>
    self.queryNode(`/chains/main/blocks/${blockHash}`, QueryTypes.GET),
  emmyDelay: priority => {
    const times = self.networkConstants.time_between_blocks

    return times.length > 1
      ? Number(times[0]) + Number(times[1]) * priority
      : Number(times[0]) * (priority + 1)
  },
  emmyPlusDelay: (priority, endorsingPower) => {
    const emmyDelay = self.emmyDelay(priority)
    const delayPerMissingEndorsement = Number(
      self.networkConstants.delay_per_missing_endorsement
    )

    return endorsingPower >= 18
      ? emmyDelay
      : emmyDelay +
          delayPerMissingEndorsement * Math.max(0, 18 - endorsingPower)
  },
  endorsingPower: async endorsements =>
    (await Promise.all(
      endorsements.map(
        ({
          chain_id: chainId,
          branch,
          contents: completeContents,
          signature
        }) => {
          const { metadata, ...contents } = completeContents[0]
          return self.getEndorsingPower(chainId, {
            branch,
            contents: [contents],
            signature
          })
        }
      )
    )).reduce((p, c) => p + c, 0)
}

export * from './rpc.d'
export default self
