import rpc, { QueryTypes } from './rpc';
import utils, { Prefix } from './utils';
import crypto from './crypto';

import {
    AccuserInterface
} from './accuser.d';

const self:AccuserInterface = {
    //
    // States
    //
    // (* Endorsements seen so far *)
    endorsements: [], //Kind.endorsement operation Delegate_Map.t HLevel.t ;
    // (* Blocks received so far *)
    blocks: [], //Block_hash.t Delegate_Map.t HLevel.t;
    preservedLevels: 5,
    // (* Highest level seen in a block *)
    highestLevelEncountered: 0,
    //
    // Functions
    //
    run: async (keys, head) => {
        const { hash, header: { level } } = head;
        
        const predecessors = await rpc.getPredecessors(hash, 10);
        const blocks = await Promise.all(predecessors.map((blockHash:string, index) => rpc.getBlock(blockHash)));

        console.log(blocks)
        blocks.forEach((block, index) => {
            if (self.highestLevelEncountered < block.header.level) {
                self.highestLevelEncountered = block.header.level;
            }

            if(blocks.some(({ metadata: { baker }, header: { level } }, i) => 
                i !== index && 
                baker === block.metadata.baker &&
                level === block.header.level
            )) {
                alert(`Double baking by: ${block.metadata.baker} on level [${block.header.level}]`);
            }
        });
        
    },
    accuse: () => {

    }
};

export * from './accuser.d';
export default self;