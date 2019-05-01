import https from 'https';
import http from 'http';
import fs from 'fs';
import { GraphQLClient } from 'graphql-request';

import utils, { Prefix } from './utils';
import operations, {
    UnsignedOperationProps,
    UnsignedOperations
}  from './operations';

import {
    NetworkConstants,
    RPCInterface,
    LoadOptions
} from './rpc.d';

export enum QueryTypes {
    GET     = 'GET',
    POST    = 'POST'
};

export const DEFAULT_NODE_ADDRESS = '67.207.68.241';
export const DEFAULT_API_ADDRESS = 'http://67.207.68.241:8080/v1alpha1/graphql';
export const DEFAULT_TZSCAN_API_ADDRESS = 'api.zeronet.tzscan.io';

const self:RPCInterface = {
    ready: false,
    nodeAddress: DEFAULT_NODE_ADDRESS,
    tzScanAddress: DEFAULT_TZSCAN_API_ADDRESS,
    apiAddress: DEFAULT_API_ADDRESS,
    apiClient: null,
    network: "",
    networkEpoch: "",
    networkConstants: {},
    load: async (options:LoadOptions) => {
        if (options.nodeAddress)
            self.nodeAddress = options.nodeAddress;
        
        if (options.tzScanAddress)
            self.tzScanAddress = options.tzScanAddress;

        if (options.apiAddress) {
            self.apiAddress = options.apiAddress;
            self.apiClient = new GraphQLClient(options.apiAddress, {
                headers: {
                    "X-Hasura-Admin-Secret": 'myadminsecretkey'
                }
            })
        }

        await self.setNetworkConstants();
        await self.setCurrentNetwork();
        await utils.verifyNodeCommits();

        return self.ready = true;
    },
    setCurrentNetwork: async () => {
        const versions = await self.queryNode('/network/versions', QueryTypes.GET) as [{chain_name:string}] | void;
        
        if(versions && versions[0].chain_name) {
            /* This will parse the network name
            *
            *  <versions string format> : "TEZOS_<network>_<networkEpoch>"
            */
            const networkInfo = versions[0].chain_name.split('_');
            self.network = networkInfo[1];
            self.networkEpoch = networkInfo[2];

            return;
        }
        throw Error('Cannot get the current tezos Network.')
    },
    setNetworkConstants: async () => {
        self.networkConstants = await self.queryNode('/chains/main/blocks/head/context/constants', QueryTypes.GET) as NetworkConstants;
    },
    getCurrentHead: () => (
        self.queryNode('/chains/main/blocks/head', QueryTypes.GET)
    ),
    getCurrentBlockHeader: () => (
        self.queryNode('/chains/main/blocks/head/header', QueryTypes.GET)
    ),
    queryNode: (path, method, args) => {
        const options = {
            hostname: self.nodeAddress,
            port: 443,
            timeout: 60000, // 1min
            path,
            method,
            key: fs.readFileSync('app/certs/server.key'),
            cert: fs.readFileSync('app/certs/server.crt'),
            headers: {
                'Content-Type': 'application/json'
            },
            requestCert: false,
            rejectUnauthorized: false
        } as any;

        options.agent = new https.Agent(options);

        return self.queryRequest(options, args);

    },
    queryTzScan: (path, method = QueryTypes.GET, args) => {
        const options = {
            hostname: self.tzScanAddress,
            port: 80,
            timeout: 60000, // 1min
            path: `/v3${path}`,
            method
        };
        return self.queryRequest(options, args);
    },
    // GraphQL
    queryAPI: (query, variables) => {
        if (!self.apiClient)
            throw "API configuration missing!";

        return variables ? self.apiClient.request(query, variables) : self.apiClient.request(query);
    },
    /*
    *   All paths that contain parameters need to include / before the ?
    *   (for example: https://address/.../?parameter=xyz)
    */ 
    queryRequest: (options, args) => (
        new Promise((resolve, reject) => {
            try {
                let req;
                if (options.port === 443)
                    req = https.request(options, res => {
                        res.setEncoding('utf8');
                        let result = '';
                        
                        res.on('data', chunk => {
                            result += chunk;
                        });

                        res.on('end', () => {
                            res.statusCode === 200 ? resolve(JSON.parse(result)) : reject(res.statusMessage);
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
                            res.statusCode === 200 ? resolve(JSON.parse(result)) : reject(res.statusMessage);
                        });

                    });

                req.on('error', e => reject(e.message));

                if (options.method === QueryTypes.POST) {
                    req.write(JSON.stringify(args));
                }

                req.end();
            }
            catch(e) {
                reject(e.message);
            }
        })
    ),
    getCounter: async pkh => (
        Number(await self.queryNode(`/chains/main/blocks/head/context/contracts/${pkh}/counter`, QueryTypes.GET))
    ),
    getManager: async pkh => (
        await self.queryNode(`/chains/main/blocks/head/context/contracts/${pkh}/manager_key`, QueryTypes.GET)
    ),
    getBalance: async pkh => (
        Number(await self.queryNode(`/chains/main/blocks/head/context/contracts/${pkh}/balance`, QueryTypes.GET))
    ),
    simulateOperation: async (from, keys, operation) => {
        const {forgedConfirmation, ...verifiedOp} = await operations.prepareOperations(from, keys, [operation]);
        
        return await
            self.queryNode('/chains/main/blocks/head/helpers/scripts/run_operation', QueryTypes.POST, verifiedOp);
    },
    forgeOperation: async (head, operation, skipConfirmation = false) => {
        const forgedOperation = await self.queryNode(`/chains/main/blocks/head/helpers/forge/operations`, QueryTypes.POST, operation);

        if (!skipConfirmation) {
            const forgedConfirmation = operation.contents.reduce((prev, cur) => {
                return prev += operations.forgeOperationLocally(cur);
            }, utils.bufferToHex(utils.b58decode(operation.branch, Prefix.blockHash)));
            
            console.log(forgedOperation);
            console.log(forgedConfirmation);
            if (forgedOperation !== forgedConfirmation) throw Error('[RPC] - Validation error on operation forge verification.');
        }

        return {
            ...operation,
            protocol: head.protocol,
            forgedConfirmation: forgedOperation
        };
    },
    preapplyOperations: async operations => {
        const preappliedOps = await self.queryNode('/chains/main/blocks/head/helpers/preapply/operations', QueryTypes.POST, operations) as UnsignedOperationProps[];

        if (!Array.isArray(preappliedOps))
            throw Error('[RPC] - Error on preapplying operations.');

        console.log(preappliedOps)

        if(
            preappliedOps.some(({contents}) => contents && contents.some(({metadata: { operation_result } }) => 
            operation_result && operation_result.status === "failed"))
        ) {
            throw Error(`[RPC] - Failed to preapply operations.`);
        }

        return preappliedOps;
    },
    injectOperation: async ({signedOperationContents, ...rest}) => {
        const [preappliedOp] = await self.preapplyOperations([rest]);
        const operationHash = await self.queryNode('/injection/operation', QueryTypes.POST, signedOperationContents) as string;
        console.log(`END: ${new Date().toJSON()}`)
        return {
            hash: operationHash,
            ...preappliedOp
        };
    },
    getEndorsementOperations: async blockId => {      
        const operations = await self.queryNode(`/chains/main/blocks/${blockId}/operations`, QueryTypes.GET) as UnsignedOperations;
        
        return Array.isArray(operations) && operations.length ? operations[0] : [];
    },
    getPredecessors: async (blockHash, length) => {
        const res = await self.queryNode(`/chains/main/blocks/?head=${blockHash}&length=${length}`, QueryTypes.GET) as string[][];

        return Array.isArray(res) && res.length > 0 ? res[0] : [];
    },
    getBlock: (blockHash) => (
        self.queryNode(`/chains/main/blocks/${blockHash}`, QueryTypes.GET)
    )
};

export * from './rpc.d';
export default self;