import rpc, { QueryTypes } from './rpc';
import Operations from './operations';
import bakingController from './bakingController';
import utils, { Prefix } from './utils';
import crypto from './crypto';

import {
    LogOrigins,
    LogSeverity
} from './logger';

import {
    BakerInterface,
    CompletedBaking,
    CompletedBakingsFromServer,
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
            const metadata = await rpc.getBlockMetadata('head');

            if (!metadata)
                return;
            
            let bakingRights = await rpc.queryNode(`/chains/main/blocks/head/helpers/baking_rights?delegate=${pkh}&cycle=${metadata.level.cycle}&max_priority=5`, QueryTypes.GET) as BakingRight[];

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
        catch(e) { throw e; };
    },
    levelCompleted: () => {
        self.bakedBlocks = [
            ...self.bakedBlocks.slice(1, 5), 
            self.levelWaterMark
        ];
    },
    run: async (pkh, header, logger) => {
        self.levelWaterMark = header.level+1;

        try {
            /*
            *   Check if the block was already baked before
            */
            if (self.bakedBlocks.indexOf(self.levelWaterMark) !== -1) return;

            const bakingRight = await rpc.queryNode(`/chains/main/blocks/head/helpers/baking_rights?delegate=${pkh}&level=${self.levelWaterMark}&max_priority=5`, QueryTypes.GET) as BakingRight[];

            if(!Array.isArray(bakingRight)) {
                return logger({
                    message: 'Not able to get baking rights.',
                    type: 'error',
                    severity: LogSeverity.VERY_HIGH,
                    origin: LogOrigins.BAKER
                });
            }
            
            /*
            *   If no baking rights were received, then add level as already baked.
            */
            if (bakingRight.length === 0) {
                self.levelCompleted();
                return logger({
                    message: `No baking rights found for level ${self.levelWaterMark}.`,
                    type: 'info',
                    severity: LogSeverity.NEUTRAL,
                    origin: LogOrigins.BAKER
                });
            }

            /*
            *   Wait until is time to bake, but stop if someone already baked this new head
            */
            while (bakingRight[0].level === self.levelWaterMark) {
                /*
                *   Check if is time to bake
                */
                if (new Date().getTime() >= new Date(bakingRight[0].estimated_time).getTime()) {
                    logger({
                        message: `Baking a block with a priority of [ ${bakingRight[0].priority} ] on level ${bakingRight[0].level}`,
                        type: 'info',
                        severity: LogSeverity.NEUTRAL,
                        origin: LogOrigins.BAKER
                    });
                    /*
                    *   Start baking the block
                    */
                    const block = await self.bake(header, bakingRight[0].priority, bakingRight[0].estimated_time, logger);
                    /*
                    *   Check if the block was successfully baked and inject it
                    */
                    if (block) {
                        logger({
                            message: `Block baked at level ${block.level}, in pending state now...`,
                            type: 'info',
                            severity: LogSeverity.NEUTRAL,
                            origin: LogOrigins.BAKER
                        });
                        /*
                        *   Inject the block
                        */
                        try {
                            const blockHash = await rpc.queryNode('/injection/block/?chain=main', QueryTypes.POST, block.data)
                            /*
                            *   Check if the block failed to be injected
                            */
                            if(!blockHash) {
                                logger({ 
                                    message: 'Inject failed',
                                    type: 'error',
                                    severity: LogSeverity.HIGH,
                                    origin: LogOrigins.BAKER
                                });
                                return;
                            }
                            
                            self.injectedBlocks.push(blockHash);
                            /*
                            *   Add nonce if this block was a commitment
                            */
                            if(block.seed)
                            {
                                bakingController.addNonce({
                                    hash: blockHash,
                                    seedNonceHash: block.seed_nonce_hash,
                                    seed: block.seed,
                                    level: block.level
                                });
                            }
                            
                            logger({ 
                                message: `Baked ${blockHash} block at level ${block.level}`,
                                type: 'success',
                                severity: LogSeverity.HIGH,
                                origin: LogOrigins.BAKER
                            });
                        }
                        catch(e) {
                            console.error(e);
                        }
                    }
                    else {
                        logger({
                            message: `Failed to bake Block for level ${self.levelWaterMark}.`,
                            type: 'error',
                            severity: LogSeverity.VERY_HIGH,
                            origin: LogOrigins.BAKER
                        });
                    }

                    break;
                }
                else {
                    /*
                    *   Wait a second before trying again
                    */
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            self.levelCompleted();
        }
        catch(e) { 
            console.error('error', e);
            self.levelCompleted();
        };
    },
    bake: async (header, priority, timestamp, logger) => {
        const newTimestamp = Math.max(Math.floor(Date.now()/1000), new Date(timestamp).getTime()/1000);

        const operationArgs = {} as {
            seed: string;
            seedHash: Uint8Array;
            nonceHash: string;
            seedHex: string;
        };
        
        if (header.level % Number(rpc.networkConstants['blocks_per_commitment']) === 0) {
            logger({
                message: `Level ${self.levelWaterMark} requires nonce reveal.Commitment Time.`,
                type: 'info',
                severity: LogSeverity.NEUTRAL,
                origin: LogOrigins.BAKER
            });

            operationArgs.seed = crypto.hexNonce(64);
            operationArgs.seedHash = crypto.seedHash(operationArgs.seed);
            operationArgs.nonceHash = utils.b58encode(operationArgs.seedHash, Prefix.nce);
            operationArgs.seedHex = utils.bufferToHex(operationArgs.seedHash);
        }

        /*
        *   Monitor new endorsings
        *   This is helpful to make sure a block is not built too early
        */
        let endorsements:any[] = [];
        rpc.monitorOperations(res => {
            if (Array.isArray(res))
                endorsements = [...endorsements, ...res];
        });

        /*
        *   Waits for more endorsings if needed
        */
        const delay = Number(rpc.networkConstants['delay_per_missing_endorsement'] || 10) * 1000;
        while(/*endorsements.length < 12 && */Date.now() < new Date(timestamp).getTime() + delay) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const pendingOperations = await rpc.getPendingOperations();

        const operations = await Operations.classifyOperations(pendingOperations, header.protocol);
        console.log(pendingOperations, operations);

        /*
        *   Signature cannot be empty, using a fake signature. [Is not important for this operation]
        */
        let blockHeader = {
            protocol_data: {
                protocol: header.protocol,
                priority,
                proof_of_work_nonce: "0000000000000000",
                signature: "edsigtdv1u5ZbjH4ZTyWsahG1XZeKV64kaZypXqysxvEZtq5L36RAwbQamXmGMJecEiUgb2tQaYk5EXgeuD4Zov6uEa7t7L63f5"
            },
            operations
        };

        operationArgs.nonceHash &&
            (blockHeader.protocol_data["seed_nonce_hash"] = operationArgs.nonceHash);

        let res = await rpc.queryNode(`/chains/main/blocks/head/helpers/preapply/block?sort=true&timestamp=${newTimestamp}`, QueryTypes.POST, blockHeader)
            .catch(error => {
                console.log(error);
            });

        if (!res || !res.shell_header) return;

        let { shell_header, operations:ops } = res;

        shell_header['protocol_data'] = utils.createProtocolData(priority);

        // Cannot have hash field, needs to be removed
        ops = ops.reduce((prev:any, cur:any) => {
            // Hash field is not allowed here, needs to be removed
            return [
                ...prev,
                cur.applied.reduce((prev2:any, cur2:any) => {
                    return [
                        ...prev2,
                        {
                            data: cur2.data,
                            branch: cur2.branch
                        }
                    ];
                }, [])
            ]
        }, []);

        console.log(shell_header, ops)
        const { block } = await rpc.queryNode('/chains/main/blocks/head/helpers/forge_block_header', QueryTypes.POST, shell_header) as { block:string };

        const start = Date.now();

        const pow = await crypto.POW(block.substring(0, block.length - 22), priority, operationArgs.seedHex);

        const secs = ((Date.now() - start) / 1000);

        const attemptsRate = ((pow.attempt/secs)/1000).toLocaleString('fullwide', {maximumFractionDigits:2});

        logger({
            message: `POW found in ${pow.attempt} attemps and took ${secs} seconds with a ratio of [${attemptsRate}] Ka/s`,
            type: 'info',
            severity: LogSeverity.NEUTRAL,
            origin: LogOrigins.BAKER
        });

        const signed = crypto.sign(pow.blockbytes, utils.mergeBuffers(utils.watermark.blockHeader, utils.b58decode(header.chain_id, Prefix.chainId)));

        return {
            timestamp,
            data: {
                data: signed.signedBytes,
                operations: ops
            },
            seed_nonce_hash: operationArgs.seedHex,
            seed: operationArgs.seed,
            level: self.levelWaterMark,
            chain_id: header.chain_id
        };
    },
};

export * from './baker.d';
export default self;