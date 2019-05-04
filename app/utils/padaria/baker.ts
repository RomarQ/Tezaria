import rpc, { QueryTypes } from './rpc';
import { UnsignedOperationProps, UnsignedOperations } from './operations';
import utils, { Prefix } from './utils';
import crypto from './crypto';

import {
    BakerInterface,
    CompletedBaking,
    CompletedBakingsFromServer,
    IncomingBakings,
    IncomingBakingsFromServer,
    BakingRight
} from './baker.d';

const self:BakerInterface = {
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
    getCompletedBakings: async (pkh:string):Promise<CompletedBaking[]> => {
        try {
            const res = await rpc.queryTzScan(`/bakings/${pkh}`, QueryTypes.GET) as CompletedBakingsFromServer[];

            return res.reduce((prev, cur) => {
                if(!cur) return;
                
                prev.push({
                    rewards: utils.parseTEZWithSymbol(Number(rpc.networkConstants['block_reward'])),
                    level: cur.level,
                    cycle: cur.cycle,
                    priority: cur.priority,
                    missed_priority: cur.missed_priority,
                    bake_time: cur.bake_time,
                    baked: cur.baked,
                    timestamp: cur.timestamp
                });

                return prev;
            }, []);

        }
        catch(e) { throw "Not able to get Completed Bakings."; };
    },
    getIncomingBakings: async pkh => {
        try {
            const metadata = await rpc.getCurrentBlockMetadata();

            if (!metadata)
                return;
            
            let bakingRights = await rpc.queryNode(`/chains/main/blocks/head/helpers/baking_rights?delegate=${pkh}&cycle=${metadata.level.cycle}`, QueryTypes.GET) as BakingRight[];

            bakingRights = bakingRights.filter(right => !!right.estimated_time);
                
            /*
            *   Decided to remove the custom API call on this process for sake of simplicity for new bakers

                // This code will possible be used in future versions, since I plan this tool to be customizable.

                const res = await rpc.queryNode(`/incoming_bakings/?delegate=${pkh}`, QueryTypes.GET) as IncomingBakingsFromServer;
                const cycle = res.current_cycle;

                let bakings = res.bakings.reduce((prev, cur, i):any => {
                    
                    cur.map(obj => {
                        if(obj.estimated_time && new Date(obj.estimated_time) > new Date()) {
                            prev.push({ cycle: cycle+i, ...obj });
                        }
                    })

                    return prev;
                }, [] as BakingRight[]);
            */

            return {
                hasData: true,
                cycle: metadata.level.cycle,
                bakings: bakingRights
            };

        } 
        catch(e) { throw "Not able to get Incoming Baking Rights."; };
    },
    levelCompleted: () => {
        self.bakedBlocks = [
            ...self.bakedBlocks.slice(1, self.bakedBlocks.length > 5 ? 4 : self.bakedBlocks.length-1), 
            self.levelWaterMark
        ];
    },
    run: async (keys, head, logger) => {
        self.levelWaterMark = head.header.level+1;

        try {
            /*
            *   Check if the block was already baked before
            */
            if (self.bakedBlocks.indexOf(self.levelWaterMark) !== -1) return;

            let bakingRight = await rpc.queryNode(`/chains/main/blocks/head/helpers/baking_rights?delegate=${keys.pkh}&level=${self.levelWaterMark}&max_priority=5`, QueryTypes.GET) as BakingRight[];

            if(!Array.isArray(bakingRight)) {
                console.error("Not able to get Baking Rights :(");
                return;
            }
            
            // If no baking rights were received, then add level as already baked.
            if (bakingRight.length === 0) {
                self.levelCompleted();
                return;
            }

            // Check if is time to bake
            if (new Date().getTime() >= new Date(bakingRight[0].estimated_time).getTime() && bakingRight[0].level === self.levelWaterMark)
            {
                console.log(`Baking a block with a priority of [ ${bakingRight[0].priority} ] on level ${bakingRight[0].level}`);

                const bake = await self.bake(keys, head, bakingRight[0].priority, bakingRight[0].estimated_time);

                console.log(bake);

                if(bake) {
                    self.pendingBlocks.push(bake);
                    console.log(`Block baked, in pending state now...`);
                }
                else 
                    console.error(`Failed to bake Block on level ${self.levelWaterMark} :(`);

                self.levelCompleted();
            }
        }
        catch(e) { console.error('error', e); };
    },
    bake: async (keys, head, priority, timestamp) => {
        console.log('\n\nBaking...\n\n');

        const newTimestamp = Math.max(Math.floor(Date.now()/1000), new Date(timestamp).getTime()/1000);

        const operations = [
            [],
            [],
            [],
            []
        ] as UnsignedOperations;

        const operationArgs = {
            seed: '',
            seedHash: new Uint8Array([]),
            nonceHash: '',
            seedHex: ''
        };
        
        if (self.levelWaterMark % Number(rpc.networkConstants['blocks_per_commitment']) === 0) {
            operationArgs.seed = crypto.hexNonce(64);
            operationArgs.seedHash = crypto.seedHash(operationArgs.seed);
            operationArgs.nonceHash = utils.b58encode(operationArgs.seedHash, Prefix.nce);
            operationArgs.seedHex = utils.bufferToHex(operationArgs.seedHash);
        }

        const pendingOperations = await rpc.queryNode(`/chains/main/mempool/pending_operations`, QueryTypes.GET);
        
        if(!pendingOperations || !pendingOperations.applied) return;
        
        const addedOps = [] as string[];
        pendingOperations.applied.map((op:UnsignedOperationProps) => {
            if (addedOps.indexOf(op.hash) === -1) {
                if(op.branch !== head.hash) return;

                const operationType = utils.operationType(op);

                if (operationType < 0) return;
                
                addedOps.push(op.hash);
                operations[operationType].push({
                    protocol: head.protocol,
                    branch: op.branch,
                    contents: op.contents,
                    signature: op.signature
                })
            }
        });

        // Signature cannot be empty, using a dumb signature. [Is not important for this operation]
        let header = {
            protocol_data: {
                protocol : head.protocol,
                priority,
                proof_of_work_nonce : "0000000000000000",
                signature : "edsigtdv1u5ZbjH4ZTyWsahG1XZeKV64kaZypXqysxvEZtq5L36RAwbQamXmGMJecEiUgb2tQaYk5EXgeuD4Zov6uEa7t7L63f5"
            },
            operations: operations
        };

        if(operationArgs.nonceHash) header.protocol_data["seed_nonce_hash"] = operationArgs.nonceHash;

        let res = await rpc.queryNode(`/chains/main/blocks/head/helpers/preapply/block?sort=true&timestamp=${newTimestamp}`, QueryTypes.POST, header)
        .catch(error => {
            console.log(error)
            // Hackish fix for id: "error: baking.timestamp_too_early"
            return rpc.queryNode(`/chains/main/blocks/head/helpers/preapply/block?sort=true&timestamp=${newTimestamp+20}`, QueryTypes.POST, header)
        });

        if(!res) {
            console.log("Preapply failed, sending empty operations now.");
            header.operations = [[],[],[],[]];
            res = await rpc.queryNode(`/chains/main/blocks/head/helpers/preapply/block?sort=true&timestamp=${newTimestamp}`, QueryTypes.POST, header);
        };

        console.log('res', res);

        console.log("!Starting POW...", res);

        let { shell_header, operations:ops } = res;

        shell_header['protocol_data'] = utils.createProtocolData(priority);

        // Cannot have hash field, needs to be removed
        ops = ops.reduce((prev:any, cur:any) => {
            prev.push(
                // Hash field is not allowed here, needs to be removed 
                cur.applied.reduce((prev2:any, cur2:any) => {
                    prev2.push({
                        data: cur2.data,
                        branch: cur2.branch
                    })
                    return prev2;
                }, [])
            );
            return prev;
        }, []);

        console.log(shell_header, ops)
        const { block } = await rpc.queryNode('/chains/main/blocks/head/helpers/forge_block_header', QueryTypes.POST, shell_header) as { block:string };

        let forged = block.substring(0, block.length - 22);
        
        const start = Date.now();

        const pow = await crypto.POW(forged, priority, operationArgs.seedHex) as any;

        const secs = ((Date.now() - start) / 1000);

        console.log(`POW found in ${pow.att} attemps ${secs} seconds - ${((pow.att/secs)/1000).toLocaleString('fullwide', {maximumFractionDigits:2})} Kh/s`);

        const signed = crypto.sign(pow.blockbytes, keys.sk, utils.mergeBuffers(utils.watermark.blockHeader, utils.b58decode(head.chain_id, Prefix.chainId)));

        return {
            timestamp,
            data: {
                data: signed.signedBytes,
                operations: ops
            },
            seed_nonce_hash: operationArgs.seedHex,
            seed: operationArgs.seed,
            level: self.levelWaterMark,
            chain_id: head.chain_id
        };
    },
};

export * from './baker.d';
export default self;