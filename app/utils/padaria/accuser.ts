import http from 'http';
import rpc, { QueryTypes } from './rpc';
import operations from './operations';
import bakingController from './bakingController';

import {
    AccuserInterface
} from './accuser.d';

const self:AccuserInterface = {
    /*
    * States
    */
    // Endorsements seen so far
    endorsements: [],
    // Blocks received so far
    blocks: [],
    preservedLevels: 5,
    // Highest level seen in a block
    highestLevelEncountered: 0,
    /*
    * Functions
    */
    run: async (keys, logger) => {
        const options = {
            hostname: rpc.nodeAddress,
            port: 3000,
            path: '/monitor/valid_blocks',
            method: QueryTypes.GET,
            headers: {
                'Content-Type': 'application/json'
            }
        } as any;

        options.agent = new http.Agent(options);

        try {
            await rpc.queryStreamRequest(options, async (block:any) => {
                if (block.level > self.highestLevelEncountered) {
                    self.highestLevelEncountered = block.level;
                }
        
                self.blocks = await [
                    await rpc.getBlock(block.hash),
                    ...self.blocks.filter(b => b.header.level > self.highestLevelEncountered - self.preservedLevels)
                ];

                console.log(self.blocks);
        
                self.blocks.reduce((prev, cur) => {
                    const evidenceIndex = prev.findIndex(b => b.header.level == cur.header.level && b.metadata.baker == cur.metadata.baker);
        
                    /*
                    *   Double Baking Found
                    */
                    if (evidenceIndex !== -1) {
                        if (cur.metadata.baker === keys.pkh) {
                            bakingController.forcedLock = true;
                            logger({ 
                                message: `You double baked at level [ ${cur.header.level} ] on blocks [${cur.hash}, ${prev[evidenceIndex].hash}] , shutting down the baker...`,
                                type: 'error',
                                severity: LogSeverity.VERY_HIGH
                            });
                        }
                        else {
                            logger({ 
                                message: `Baker ${cur.metadata.baker} double baked at level ${cur.header.level}, accusing now...`,
                                type: 'info',
                                severity: LogSeverity.HIGH
                            });
        
                            operations.doubleBakingEvidence(keys, [cur.header, prev[evidenceIndex].header]);
                        }
        
                        return [
                            ...prev.slice(0, evidenceIndex),
                            ...prev.slice(evidenceIndex+1, prev.length)
                        ];
                    }
        
                    return [
                        cur,
                        ...prev
                    ];
        
                }, [] as BlockProps[]);
            });
        }
        catch(e) {
            console.error(e);
        }
    }
};

export * from './accuser.d';
export default self;