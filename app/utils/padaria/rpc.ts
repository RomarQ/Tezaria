import https from 'https';
import http from 'http';

import utils, { Prefix } from './utils';
import rewarder from './rewarder';

import operations, {
	UnsignedOperationProps,
	UnsignedOperations,
	PendingOperations
} from './operations';

import { NetworkConstants, RPCInterface } from './rpc.d';

export enum QueryTypes {
	GET = 'GET',
	POST = 'POST'
}

export const DEFAULT_NODE_ADDRESS = 'rpc.tezaria.com';
export const DEFAULT_NODE_PORT = 80;
export const DEFAULT_API_ADDRESS = 'http://67.207.68.241:8080/v1alpha1/graphql';
export const DEFAULT_TZSCAN_API_ADDRESS = 'api.zeronet.tzscan.io';

const self: RPCInterface = {
	ready: false,
	nodeAddress: DEFAULT_NODE_ADDRESS,
	nodePort: DEFAULT_NODE_PORT,
	tzScanAddress: DEFAULT_TZSCAN_API_ADDRESS,
	apiAddress: DEFAULT_API_ADDRESS,
	apiClient: null,
	network: '',
	networkEpoch: '',
	networkConstants: {},
	load: async options => {
		options.nodeAddress && (self.nodeAddress = options.nodeAddress);
		options.nodePort && (self.nodePort = options.nodePort);
		options.tzScanAddress && (self.tzScanAddress = options.tzScanAddress);
		options.rewardsBatchSize &&
			(rewarder.paymentsBatchSize = options.rewardsBatchSize);
		options.delegatorFee && (rewarder.feePercentage = options.delegatorFee);

		/*
        if (options.apiAddress) {
            self.apiAddress = options.apiAddress;
            self.apiClient = new GraphQLClient(options.apiAddress, {
                headers: {
                    "X-Hasura-Admin-Secret": 'myadminsecretkey'
                }
            });
        }
        */
		(window as any).getDelegatorsRewardsByCycle =
			rewarder.getDelegatorsRewardsByCycle;

		await self.setNetworkConstants();
		await self.setCurrentNetwork();
		await utils.verifyNodeCommits();

		return (self.ready = true);
	},
	setCurrentNetwork: async () => {
		const versions = (await self.queryNode(
			'/network/versions',
			QueryTypes.GET
		)) as [{ chain_name: string }] | void;

		if (versions && versions[0].chain_name) {
			/* This will parse the network name
			 *
			 *  <versions string format> : "TEZOS_<network>_<networkEpoch>"
			 */
			const networkInfo = versions[0].chain_name.split('_');
			self.network = networkInfo[1];
			self.networkEpoch = networkInfo[2];

			return;
		}
		throw Error('Cannot get the current tezos Network.');
	},
	setNetworkConstants: async () => {
		self.networkConstants = (await self.queryNode(
			'/chains/main/blocks/head/context/constants',
			QueryTypes.GET
		)) as NetworkConstants;
	},
	getCurrentLevel: (chainId = 'main', blockId = 'head') =>
		self.queryNode(
			`/chains/${chainId}/blocks/${blockId}/helpers/current_level`,
			QueryTypes.GET
		),
	getCurrentCycle: async (chainId = 'main', blockId = 'head') => {
		const { level } = await self.getCurrentLevel(chainId, blockId);

		return (
			level &&
			Math.floor(level / self.networkConstants['blocks_per_cycle'])
		);
	},
	getCurrentHead: () =>
		self.queryNode('/chains/main/blocks/head', QueryTypes.GET),
	getBlockHash: blockId =>
		self.queryNode(`/chains/main/blocks/${blockId}/hash`, QueryTypes.GET),
	getBlockHeader: blockId =>
		self.queryNode(`/chains/main/blocks/${blockId}/header`, QueryTypes.GET),
	getBlockMetadata: blockId =>
		self.queryNode(
			`/chains/main/blocks/${blockId}/metadata`,
			QueryTypes.GET
		),
	getBlockOperations: blockId =>
		self.queryNode(
			`/chains/main/blocks/${blockId}/operations`,
			QueryTypes.GET
		),
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
			timeout: 3000, // 1min
			path,
			method,
			headers: {
				'Content-Type': 'application/json'
			}
		} as any;

		options.agent =
			self.nodePort == 443
				? new https.Agent(options)
				: new http.Agent(options);

		return self.queryRequest(options, args);
	},
	queryTzScan: (path, method = QueryTypes.GET, args) => {
		const options = {
			hostname: self.tzScanAddress,
			port: 80,
			//timeout: 60000, // 1min
			path: `/v3${path}`,
			method
		};
		return self.queryRequest(options, args);
	},
	// GraphQL
	queryAPI: (query, variables) => {
		if (!self.apiClient) throw 'API configuration missing!';

		return variables
			? self.apiClient.request(query, variables)
			: self.apiClient.request(query);
	},
	/*
	 *   All paths that contain parameters need to include / before the ?
	 *   (for example: https://address/.../?parameter=xyz)
	 */

	queryRequest: (options, args) =>
		new Promise((resolve, reject) => {
			try {
				let req;
				if (options.port == 443)
					req = https.request(options, res => {
						res.setEncoding('utf8');
						let result = '';

						res.on('data', chunk => {
							result += chunk;
						});

						res.on('end', () => {
							try {
								if (res.statusCode === 200)
									return resolve(JSON.parse(result));

								reject(new Error(result));
							} catch (e) {
								reject(new Error(e));
							}
						});
					});
				else
					req = http.request(options, res => {
						res.setEncoding('utf8');
						let result = '';

						res.on('data', chunk => {
							result += chunk;
						});

						res.on('end', () => {
							try {
								if (res.statusCode === 200)
									return resolve(JSON.parse(result));

								reject(new Error(result));
							} catch (e) {
								console.log(result);
								reject(new Error(e));
							}
						});
					});

				req.on('error', e => {
					reject(e);
				});

				if (options.method === QueryTypes.POST) {
					req.write(JSON.stringify(args));
				}

				req.end();
			} catch (e) {
				reject(new Error(e));
			}
		}),
	queryStreamRequest: (options, cb) => {
		return new Promise((resolve, reject) => {
			try {
				let req;
				if (options.port == 443)
					req = https.request(options, res => {
						res.setEncoding('utf8');
						let result = '';

						res.on('data', chunk => {
							try {
								result += chunk;
								cb(JSON.parse(result), resolve);
								result = '';
							} catch (e) {}
						});

						res.on('end', () => resolve());
					});
				else
					req = http.request(options, res => {
						res.setEncoding('utf8');
						let result = '';

						res.on('data', chunk => {
							try {
								result += chunk;
								cb(JSON.parse(result), resolve);
								result = '';
							} catch (e) {}
						});

						res.on('end', () => resolve());
					});

				req.on('error', e => {
					reject(e);
				});

				req.end();
			} catch (e) {
				reject(new Error(e));
			}
		});
	},
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
	simulateOperation: async (from, keys, operation) => {
		const {
			forgedConfirmation,
			...verifiedOp
		} = await operations.prepareOperations(from, keys, [operation]);

		return await self.queryNode(
			'/chains/main/blocks/head/helpers/scripts/run_operation',
			QueryTypes.POST,
			verifiedOp
		);
	},
	forgeOperation: async (metadata, operation, verify = true) => {
		const forgedOperation = await self.queryNode(
			`/chains/main/blocks/head/helpers/forge/operations`,
			QueryTypes.POST,
			operation
		);

		if (!forgedOperation) return;

		const forgedConfirmation = operation.contents.reduce((prev, cur) => {
			return (prev += operations.forgeOperationLocally(cur));
		}, utils.bufferToHex(utils.b58decode(operation.branch, Prefix.blockHash)));

		if (forgedOperation !== forgedConfirmation) {
			console.log(forgedOperation);
			console.log(forgedConfirmation);

			if (verify)
				throw Error(
					'[RPC] - Validation error on operation forge verification.'
				);
		}

		return {
			...operation,
			protocol: metadata.protocol,
			forgedConfirmation: forgedOperation
		};
	},
	preapplyOperations: async operations => {
		const preappliedOps = (await self.queryNode(
			'/chains/main/blocks/head/helpers/preapply/operations',
			QueryTypes.POST,
			operations
		)) as UnsignedOperationProps[];

		if (!Array.isArray(preappliedOps))
			throw new Error('[RPC] - Error on preapplying operations.');

		if (
			preappliedOps.some(
				({ contents }) => (
					contents &&
					contents.some(
						({ metadata: { operation_result } }) => (
							operation_result &&
                            operation_result.status === 'failed'
                        )
                    )
                )
			)
		) {
            console.error(preappliedOps);
			throw new Error(`[RPC] - Failed to preapply operations`);
		}

		return preappliedOps;
	},
	injectOperation: async ({ signedOperationContents, ...rest }) => {
		const [preappliedOp] = await self.preapplyOperations([rest]);
		const operationHash = (await self.queryNode(
			'/injection/operation',
			QueryTypes.POST,
			signedOperationContents
		)) as string;

		return {
			hash: operationHash,
			...preappliedOp
		};
	},
	monitorOperations: callback => {
		const options = {
			hostname: self.nodeAddress,
			port: self.nodePort,
			path: '/chains/main/mempool/monitor_operations/?applied',
			method: QueryTypes.GET,
			headers: {
				'Content-Type': 'application/json'
			}
		} as any;
		options.agent = new http.Agent(options);

		return self.queryStreamRequest(options, callback);
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
		} as any;
		options.agent =
			self.nodePort == 443
				? new https.Agent(options)
				: new http.Agent(options);

		console.log(options);
		return self.queryStreamRequest(options, callback);
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
		} as any;
		options.agent =
			self.nodePort == 443
				? new https.Agent(options)
				: new http.Agent(options);

		return self.queryStreamRequest(options, callback);
	},
	getPendingOperations: async () => {
		const pendingOperations = (await self.queryNode(
			`/chains/main/mempool/pending_operations`,
			QueryTypes.GET
		)) as PendingOperations;

		if (!pendingOperations) return;

		pendingOperations.branch_delayed.map(op => op[1]);
		pendingOperations.unprocessed.map(op => op[1]);

		// Only retain the applied, unprocessed and delayed operations
		delete pendingOperations.branch_refused;
		delete pendingOperations.refused;

		return Object.keys(pendingOperations).map(
			type => pendingOperations[type]
		);
	},
	getEndorsementOperations: async blockId => {
		const operations = (await self.queryNode(
			`/chains/main/blocks/${blockId}/operations`,
			QueryTypes.GET
		)) as UnsignedOperations;

		return Array.isArray(operations) && operations.length
			? operations[0]
			: [];
	},
	getPredecessors: async (blockHash, length) => {
		const res = (await self.queryNode(
			`/chains/main/blocks/?head=${blockHash}&length=${length}`,
			QueryTypes.GET
		)) as string[][];

		return Array.isArray(res) && res.length > 0 ? res[0] : [];
	},
	getBlock: blockHash =>
		self.queryNode(`/chains/main/blocks/${blockHash}`, QueryTypes.GET)
};

export * from './rpc.d';
export default self;
