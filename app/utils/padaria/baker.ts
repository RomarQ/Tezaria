import rpc, { queryNode, queryAPI, QueryTypes } from './rpc';
import { UnsignedOperations } from './operations';
import utils, { Prefix } from './utils';
import crypto from './crypto';
import bakingController from './bakingController';

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
            const res = await queryAPI(`/bakings/${pkh}`, QueryTypes.GET) as CompletedBakingsFromServer[];

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
        catch(e) { console.error("Not able to get Completed Bakings."); };
    },
    getIncomingBakings: async (pkh:string):Promise<IncomingBakings> => {
        try {
            const res = await queryNode(`/incoming_bakings?delegate=${pkh}`, QueryTypes.GET) as IncomingBakingsFromServer;
            const cycle = res.current_cycle;

            let bakings = res.bakings.reduce((prev, cur, i):any => {
                
                cur.map(obj => {
                if(obj.estimated_time && new Date(obj.estimated_time) > new Date()) {
                    prev.push({ cycle: cycle+i, ...obj });
                }
                })

                return prev;
            }, [] as BakingRight[]);
            
            return {
                hasData: true,
                cycle,
                bakings
            };
        } 
        catch(e) { console.error("Not able to get Incoming Baking Rights."); };
    },
    run: async (keys, head) => {
        self.levelWaterMark = head.header.level+1;

        try {
            self.pendingBlocks = self.pendingBlocks.reduce((prev, block) => {

                console.log(block.level, head.header.level, new Date() >= new Date(block.timestamp), new Date(), new Date(block.timestamp), self.pendingBlocks, self.bakedBlocks)

                /*
                *   Every block needs to be injected before their respective level starts
                */
                if(block.level <= head.header.level) {
                    console.warn(`Block ${block.level} was too late to be injected, current head level ${head.header.level}.`)
                    return prev;
                }

                /*
                *   Inject the block if the "Baking Right Timestamp" for this block is now or has already passed
                */
                if(new Date() >= new Date(block.timestamp))
                {
                    rpc.queryNode('/injection/block?chain=main&force=true', QueryTypes.POST, block.data)
                        .then((injectionHash:string) => {
                            if(!injectionHash) throw Error("Inject failed");
                            
                            self.injectedBlocks.push(injectionHash);

                            if(block.seed)
                            {
                                bakingController.addNonce({
                                    hash: injectionHash,
                                    seedNonceHash: block.seed_nonce_hash,
                                    seed: block.seed,
                                    level: block.level,
                                    revealed: false
                                });
                            }
                    
                            console.log(`Baked ${injectionHash} block at level ${block.level}`);
                        })
                        .catch((e:Error) => console.error(e));
                }
                else prev.push(block);

                return prev;
            }, []);

            /*
            *   Check if the block was already baked before
            */
            if (self.bakedBlocks.indexOf(self.levelWaterMark) !== -1) return;

            let bakingRight = await queryNode(`/chains/main/blocks/head/helpers/baking_rights?delegate=${keys.pkh}&level=${self.levelWaterMark}&max_priority=5`, QueryTypes.GET) as BakingRight[];
        
            if(!Array.isArray(bakingRight)) {
                console.error("Not able to get Baking Rights :(");
                return;
            }

            self.bakedBlocks = [
                ...self.bakedBlocks.slice(1, self.bakedBlocks.length > 5 ? 4 : self.bakedBlocks.length-1), 
                self.levelWaterMark
            ];

            // If no baking rights were received, then add level as already baked.
            if (bakingRight.length === 0) return;
            
            // Check if is time to bake
            else if (new Date().getTime() >= new Date(bakingRight[0].estimated_time).getTime() && bakingRight[0].level === self.levelWaterMark)
            {
                console.log(`Baking a block with a priority of [ ${bakingRight[0].priority} ] on level ${bakingRight[0].level}`);

                const bake = await self.bake(keys, head, bakingRight[0].priority, bakingRight[0].estimated_time);

                console.log(bake);

                if(bake) {
                    self.pendingBlocks.push(bake);
                    console.log(`Block baked, in pending state now...`);
                }
                else console.error(`Failed to bake Block on level ${self.levelWaterMark} :(`);
            }
        }
        catch(e) { console.error(e); };
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

        const pendingOperations = await queryNode(`/chains/main/mempool/pending_operations`, QueryTypes.GET);
        
        if(!pendingOperations || !pendingOperations.applied) return;
        
        const addedOps = [] as string[];
        pendingOperations.applied.map((op:any) => {
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
        .catch(() =>
            // Hackish fix for id: "error: baking.timestamp_too_early"
            queryNode(`/chains/main/blocks/head/helpers/preapply/block?sort=true&timestamp=${newTimestamp+20}`, QueryTypes.POST, header)
        );

        if(!res) {
            console.log("Preapply failed, sending empty operations now.");
            header.operations = [[],[],[],[]];
            res = await queryNode(`/chains/main/blocks/head/helpers/preapply/block?sort=true&timestamp=${newTimestamp}`, QueryTypes.POST, header);
        };

        console.log('res', res);

        console.log("!Starting POW...", res);

        let { shell_header, operations:ops }:any = res;

        shell_header['protocol_data'] = utils.createProtocolData(priority);

        // Will fail with hash field, hash field needs to be removed
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

        console.log(ops)

        const { block } = await queryNode('/chains/main/blocks/head/helpers/forge_block_header', QueryTypes.POST, shell_header) as { block:string };

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