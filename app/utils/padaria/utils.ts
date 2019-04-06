import { HeadType } from "./types";
import {
    NetworkConstants,
    QueryType,
    UtilsInterface
} from './utils.d';

export enum QueryTypes {
  GET = 'GET',
  POST = 'POST'
}

export const DEFAULT_NODE_ADDRESS = 'https://67.207.68.241';
export const DEFAULT_API_ADDRESS = 'https://api.zeronet.tzscan.io/v3';

const self:UtilsInterface = {
    ready: false,
    nodeAddress: DEFAULT_NODE_ADDRESS,
    apiAddress: DEFAULT_API_ADDRESS,
    network: "",
    networkEpoch: "",
    debug: false,
    cycleLength: 128, // 2048 for mainnet
    BLOCKS_PER_COMMITMENT: 32,
    blockTime: 20,
    threshold: 70368744177663,
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
    load: async () => {
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
        self.networkConstants = await self.queryNode('/chains/main/blocks/head/context/constants', QueryTypes.GET) as Promise<NetworkConstants | {}>;
    },
    getCurrentHead: ():Promise<HeadType> => self.queryNode('/chains/main/blocks/head', QueryTypes.GET) as Promise<HeadType>,
    queryNode: (path:string, type?:QueryType, args:any = {}) =>
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
    queryAPI: (path:string, type:QueryType = QueryTypes.GET, args:any = {}) =>
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
        }),
    operationType(op:any) {
        if(!op || !op.contents) return 3;

        switch (op.contents[0].kind) {
            case 'endorsement':
                return 0;
            case 'ballot':
                return 1;
            case 'activate_account':
                return 2;
            default:
                return 3;
        }
    },
    createProtocolData: (priority:number, powHeader = '', pow = '', seed = '') => {
        return `${priority.toString(16).padStart(4,"0")}${powHeader.padEnd(8, "0")}${pow.padEnd(8, "0")}${seed ? "ff"+seed.padEnd(64, "0") : "00"}`;
    },
    convertUnit: (value:number, to:{char:string, unit:number}, from:{char:string, unit:number} = self.uTEZ) => (
        ((value / to.unit) * from.unit).toLocaleString('fullwide', {maximumFractionDigits:3})
    ),
    convertUnitWithSymbol: (value:number, to:{char:string, unit:number}, from:{char:string, unit:number} = self.uTEZ) => (
        `${self.convertUnit(value, to, from)} ${to.char}`
    ),
    getSharePercentage: (balance:number, staking_balance:number) => (
        `${((balance * 100) / staking_balance).toLocaleString('fullwide', {maximumFractionDigits:2})}%`
    ),
    getShareReward: (balance:number, staking_balance:number, rewards:number) => (
        ((balance * rewards) / staking_balance)
    ),
    parseTEZWithSymbol: (value:number) => {
        if (value > self.MTEZ.unit) {
            return self.convertUnitWithSymbol(value, self.MTEZ);
        } else if (value > self.KTEZ.unit) {
            return self.convertUnitWithSymbol(value, self.KTEZ);
        } else if (value > self.TEZ.unit) {
            return self.convertUnitWithSymbol(value, self.TEZ);
        } else if (value > self.mTEZ.unit) {
            return self.convertUnitWithSymbol(value, self.mTEZ);
        }
        else return self.convertUnitWithSymbol(value, self.uTEZ);
    }
};

export const queryNode = self.queryNode;
export const queryAPI = self.queryAPI;

export default self;