import crypto from './crypto';
import utils, { Prefix } from './utils';
import operations, {
    OperationTypes,
    UnsignedOperationProps,
    OperationProps,
}  from './operations';

import {
    HeadType,
    NetworkConstants,
    QueryType,
    RPCInterface,
    LoadOptions
} from './rpc.d';

export enum QueryTypes {
    GET     = 'GET',
    POST    = 'POST'
}

export const DEFAULT_NODE_ADDRESS = 'https://67.207.68.241';
export const DEFAULT_API_ADDRESS = 'https://api.zeronet.tzscan.io/v3';

const self:RPCInterface = {
    ready: false,
    nodeAddress: DEFAULT_NODE_ADDRESS,
    apiAddress: DEFAULT_API_ADDRESS,
    network: "",
    networkEpoch: "",
    debug: false,
    //http://tezos.gitlab.io/mainnet/protocols/003_PsddFKi3.html#more-details-on-fees-and-cost-model
    PowHeader: "ba69ab95",
    networkConstants: {},
    watermark: {
        blockHeader:        new Uint8Array([1]), //0x01
        endorsement:        new Uint8Array([2]), //0x02
        genericOperation:   new Uint8Array([3]), //0x03
    },
    uTEZ:   { char: 'μꜩ',  unit: 1 },
    mTEZ:   { char: 'mꜩ',  unit: 1000 },
    TEZ:    { char: 'ꜩ',   unit: 1000000 },
    KTEZ:   { char: 'Kꜩ',  unit: 1000000000 },
    MTEZ:   { char: 'Mꜩ',  unit: 1000000000000 },
    setDebugMode: (mode:boolean) => self.debug = mode,
    load: async (options:LoadOptions) => {
        if (options.nodeAddress)
            self.nodeAddress = options.nodeAddress;
        
        if (options.nodeAddress)
            self.apiAddress = options.apiAddress;

        await self.setNetworkConstants();
        await self.setCurrentNetwork();

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
    queryNode: (path:string, type:QueryType, args?:any) =>
        new Promise((resolve, reject) => {
            try {
                const http = new XMLHttpRequest();
                http.open(type, `${self.nodeAddress}${path}`, true);
                
                //DEBUG
                if (self.debug) console.log("Node call", path, args);
                
                http.onload = () => {
                    if (http.status === 200) {
                        if (http.responseText) {
                            let res = JSON.parse(http.responseText);

                            //DEBUG
                            if (self.debug) console.log("Node response", path, args, res);

                            if(!res) {
                                resolve(null);
                                return;
                            }
                            
                            if(res.error) reject(res.error);
                            else resolve(res);

                        }
                        else reject("Empty response returned");
                    } 
                    else {
                        if (http.responseText) {
                            //DEBUG
                            if (self.debug) console.log(path, args, http.responseText);

                            reject(http.responseText);
                        }
                        else {  
                            //DEBUG
                            if (self.debug) console.log(path, args, http.statusText);

                            reject(http.statusText);
                        }
                    }
                };
                http.onerror = () => {
                    //DEBUG
                    if (self.debug) console.log(path, args, http.statusText);

                    reject(http.statusText);
                };

                if (type === QueryTypes.POST) {
                    http.setRequestHeader("Content-Type", "application/json");
                    http.send(JSON.stringify(args));        
                }
                else http.send();
            }
            catch(e) { reject(e) };
        }),
    queryAPI: (path:string, type:QueryType = QueryTypes.GET, args?:any) => (
        new Promise((resolve, reject) => {
            try {
                const http = new XMLHttpRequest();
                http.open(type, `${self.apiAddress}${path}`, true);
                
                //DEBUG
                if (self.debug) console.log("API call", path, args);
                
                http.onload = () => {
                    if (http.status === 200) {
                        if (http.responseText) {
                            let res = JSON.parse(http.responseText);
                            
                            //DEBUG
                            if (self.debug) console.log("Node response", path, args, res);

                            if(!res) {
                                resolve(null);
                                return;
                            }
                            
                            if(res.error) reject(res.error);
                            else resolve(res);
                        } 
                        else reject("Empty response returned");

                    }
                    else {
                        if (http.responseText) {
                            //DEBUG
                            if (self.debug) console.log(path, args, http.responseText);

                            reject(http.responseText);
                        }
                        else {  
                            //DEBUG
                            if (self.debug) console.log(path, args, http.statusText);

                            reject(http.statusText);
                        }
                    }
                };
                http.onerror = () => {
                    //DEBUG
                    if (self.debug) console.log(path, args, http.responseText);

                    reject(http.statusText);
                };
                if (type === QueryTypes.POST) {
                    http.setRequestHeader("Content-Type", "application/json");
                    http.send(JSON.stringify(args));        
                }
                else http.send();
            }
            catch(e) { reject(e) };
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
    forgeOperation: async (head, operation) => {
        const forgedOperation = await self.queryNode(`/chains/main/blocks/head/helpers/forge/operations`, QueryTypes.POST, operation);

        const forgedConfirmation = operation.contents.reduce((prev, cur) => {
            return prev += operations.forgeOperationLocally(cur);
        }, utils.bufferToHex(utils.b58decode(operation.branch, Prefix.blockHash)));
        
        console.log(forgedOperation);
        console.log(forgedConfirmation);
        if (forgedOperation !== forgedConfirmation) throw Error('[RPC] - Validation error on operation forge verification.');

        return {
            ...operation,
            protocol: head.protocol,
            forgedConfirmation
        };
    },
    preapplyOperations: async operations => {
        const preappliedOps = await self.queryNode('/chains/main/blocks/head/helpers/preapply/operations', QueryTypes.POST, operations) as UnsignedOperationProps[];

        if (!Array.isArray(preappliedOps))
            throw Error('[RPC] - Error on preapplying operations.');

        console.log(preappliedOps)

        if(
            preappliedOps.some(({contents}) => contents.some(({metadata: { operation_result } }) => 
            operation_result && operation_result.status === "failed"))
        ) {
            throw Error(`[RPC] - Failed to preapply operations.`);
        }

        return preappliedOps;
    },
    injectOperation: async ({signedOperationContents, ...rest}) => {
        const [preappliedOp] = await self.preapplyOperations([rest]);

        return {
            hash: await self.queryNode('/injection/operation', QueryTypes.POST, signedOperationContents) as string,
            ...preappliedOp
        };
    },
};

export const queryNode = self.queryNode;
export const queryAPI = self.queryAPI;

export * from './rpc.d';
export default self;