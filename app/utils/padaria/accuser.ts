import rpc, { QueryTypes } from './rpc';
import operations from './operations';
import bakingController from './bakingController';

import {
    AccuserInterface
} from './accuser.d';
import { BlockProps } from './rpc';

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
        console.log('Start: ' + new Date())
        const lastValidatedBlock = await rpc.queryNode('/monitor/valid_blocks', QueryTypes.GET);

        if (lastValidatedBlock.level > self.highestLevelEncountered) {
            self.highestLevelEncountered = lastValidatedBlock.level;
        }

        self.blocks = await [
            await rpc.getBlock(lastValidatedBlock.hash),
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

        console.log('End: ' + new Date())
    }
};

export * from './accuser.d';
export default self;