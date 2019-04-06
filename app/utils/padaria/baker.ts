import utils, { queryNode, queryAPI, QueryTypes } from './utils';
import crypto, { Prefix } from './crypto';
import bakingController from './bakingController';

import {
    BakerProps,
    CompletedBaking,
    CompletedBakingsFromServer,
    IncomingBakings,
    IncomingBakingsFromServer,
    BakingRight,
    KeysType,
    NonceType,
    HeadType,
    operationsArrayType,
} from './types';

const baker:BakerProps = {
    //
    // States
    //
    intervalId: null,
    bakedBlocks: [],
    pendingBlocks: [],
    noncesToReveal: [],
    //
    // Functions
    //
    getCompletedBakings: async (pkh:string):Promise<CompletedBaking[]> => {
        try {
            const res = await queryAPI(`/bakings/${pkh}`, QueryTypes.GET) as CompletedBakingsFromServer[];

            return res.reduce((prev, cur, i):any => {
                if(!cur) return;
                
                prev.push({
                    rewards: utils.parseTEZWithSymbol(utils.networkConstants['block_reward']),
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
    run: async (keys:KeysType, head:HeadType) => {
        try {
            baker.pendingBlocks = baker.pendingBlocks.reduce((prev:any, block:any) => {

                console.log(block.level, head.header.level, new Date() >= new Date(block.timestamp), new Date(), new Date(block.timestamp), block)

                if(block.level <= head.header.level) return prev;

                if(new Date() >= new Date(block.timestamp))
                {
                    //baker.injectedBlocks.push(block.level);
                    queryNode('/injection/block?chain=main', QueryTypes.POST, block.data)
                        .then((injectionHash:string) => {
                            console.log(injectionHash)

                            if(!injectionHash) throw Error("Inject failed");
                            
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
                    
                            console.log(`Baked pending block at level ${block.level}`);
                        })
                        .catch((e:Error) => console.error(e));
                }
                else prev.push(block);

                return prev;
            }, []);

            const { level } = head.header;

            if (baker.bakedBlocks.indexOf(level+1) != -1) return;

            let bakingRight = await queryNode(`/chains/main/blocks/head/helpers/baking_rights?delegate=${keys.pkh}&level=${level+1}`, QueryTypes.GET) as BakingRight[];
        
            if(!Array.isArray(bakingRight)) {
                console.error("Not able to get Baking Rights :(");
                return;
            }

            // Check if the block was already baked at this level
            if (baker.bakedBlocks.indexOf(level+1) < 0) {
                // If no baking rights were received, then add level as already baked.
                if (bakingRight.length === 0) baker.bakedBlocks.push(level+1);
                // Check if is time to bake
                else if (new Date().getTime() >= (new Date(bakingRight[0].estimated_time).getTime() + 5000) && bakingRight[0].level === level+1)
                {
                    baker.bakedBlocks.push(level+1);

                    console.log(`Baking a block with a priority of [ ${bakingRight[0].priority} ] on level ${bakingRight[0].level+1}`);

                    const bake = await baker.bake(keys, head, bakingRight[0].priority, bakingRight[0].estimated_time);

                    if(bake) {
                        baker.pendingBlocks.push(bake);
                        console.log(`Block baked, in pending state now...`);
                    }
                    else console.error(`Failed to bake Block on level ${level+1} :(`);
                }
            }
        }
        catch(e) { console.error(e); };
    },
    bake: async (keys:KeysType, head:HeadType, priority:number, timestamp:string) => {
        console.log('\n\nBaking...\n\n');

        const newTimestamp = Math.max(Math.floor(Date.now()/1000), new Date(timestamp).getTime()/1000);

        const level = head.header.level+1;

        const operations = [
            [],
            [],
            [],
            []
        ] as operationsArrayType;

        const operationArgs = {
            seed: '',
            seedHash: new Uint8Array([]),
            nonceHash: '',
            seedHex: ''
        };
        
        if (level % utils.networkConstants['blocks_per_commitment'] === 0) {
            operationArgs.seed = crypto.hexNonce(64);
            operationArgs.seedHash = crypto.seedHash(operationArgs.seed);
            operationArgs.nonceHash = crypto.b58encode(operationArgs.seedHash, Prefix.nce);
            operationArgs.seedHex = crypto.bufferToHex(operationArgs.seedHash);
        }

        const pendingOperations = await queryNode(`/chains/main/mempool/pending_operations`, QueryTypes.GET) as any;
        
        if(!pendingOperations || !pendingOperations.applied) return;
        
        const addedOps = [] as string[];
        pendingOperations.applied.map((op:any) => {
            if (addedOps.indexOf(op.hash) === -1) {
                if(op.branch !== head.hash) return;

                const operationType = utils.operationType(op);

                if (operationType < 0) return;
                
                addedOps.push(op.hash);
                operations[operationType].push({
                    "protocol" : head.protocol,
                    "branch": op.branch,
                    "contents": op.contents,
                    "signature": op.signature
                })
            }
        });

        // Signature cannot be empty, using a dumb signature. [Is not important for this operation]
        let header = {
            "protocol_data": {
                protocol : head.protocol,
                priority,
                proof_of_work_nonce : "0000000000000000",
                signature : "edsigtdv1u5ZbjH4ZTyWsahG1XZeKV64kaZypXqysxvEZtq5L36RAwbQamXmGMJecEiUgb2tQaYk5EXgeuD4Zov6uEa7t7L63f5"
            },
            "operations": operations
        };

        if(operationArgs.nonceHash) header.protocol_data["seed_nonce_hash"] = operationArgs.nonceHash;

        let res = await queryNode(`/chains/main/blocks/head/helpers/preapply/block?sort=true&timestamp=${newTimestamp}`, QueryTypes.POST, header);
        
        if(!res) {
            console.log("Preapply failed, sending empty operations now.");
            header.operations = [[],[],[],[]];
            res = await queryNode(`/chains/main/blocks/head/helpers/preapply/block?sort=true&timestamp=${newTimestamp}`, QueryTypes.POST, header);
        };

        if(!res) return;

        console.log("!Starting POW...", res);

        let { shell_header, operations:ops }:any = res;

        shell_header['protocol_data'] = utils.createProtocolData(priority);

        // Will fail with hash field, 
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

        const signed = crypto.sign(pow.blockbytes, keys.sk, crypto.mergeBuffer(utils.watermark.blockHeader, crypto.b58decode(head.chain_id, Prefix.chain_id)));

        return {
            timestamp,
            data: {
                data: signed.signedBytes,
                operations: ops
            },
            seed_nonce_hash: operationArgs.seedHex,
            seed: operationArgs.seed,
            level,
            chain_id: head.chain_id
        };
    },
};

export default baker;