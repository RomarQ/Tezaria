import rpc, { QueryTypes } from './rpc';
import utils, { Prefix } from './utils';
import crypto from './crypto';

import {
    EndorderInterface,
    CompletedEndorsingFromServer,
    CompletedEndorsing,
    IncomingEndorsings,
    IncomingEndorsingsFromServer,
    EndorsingRight,
} from './endorser.d';
import { OperationTypes } from './operations';

const self:EndorderInterface = {
    //
    // States
    //
    endorsedBlocks: [],
    //
    // Functions
    //
    getCompletedEndorsings: async (pkh:string):Promise<CompletedEndorsing[]> => {
        try {
            const res = await rpc.queryAPI(`/bakings_endorsement/${pkh}`, QueryTypes.GET) as CompletedEndorsingFromServer[];

            return res.reduce((prev, cur, i):any => {
                if(!cur) return;
                
                if(!cur.timestamp) {
                    prev.push({
                        rewards: "0ꜩ",
                        level: cur.level,
                        lr_nslot: cur.lr_nslot
                    });
                } else {
                    prev.push({
                        rewards: `${((cur.lr_nslot*2)/(cur.priority+1)).toLocaleString('fullwide', {maximumFractionDigits:2})}ꜩ`,
                        level: cur.level,
                        cycle: cur.cycle,
                        priority: cur.priority,
                        lr_nslot: cur.lr_nslot,
                        timestamp: cur.timestamp
                    });
                }

                return prev;
            }, []);

        } catch(e) { console.error("Not able to get Completed Endorsings."); }
    },
    getIncomingEndorsings: async (pkh:string):Promise<IncomingEndorsings> => {
        try {
            const res = await rpc.queryNode(`/incoming_endorsings?delegate=${pkh}`, QueryTypes.GET) as IncomingEndorsingsFromServer;
            const cycle = res.current_cycle;

            let endorsings:EndorsingRight[] = [];

            endorsings = res.endorsings.reduce((prev, cur, i):any => {
                if(!cur || cur.length == 0) { return prev; };
                
                cur.map(obj => {
                    if(obj.estimated_time && new Date(obj.estimated_time) > new Date()) {
                        prev.push({ cycle: cycle+i, ...obj });
                    }
                });

                return prev;
            }, endorsings);

            return {
                hasData: true,
                cycle,
                endorsings
            };
        } catch(e) { console.error("Not able to get Incoming Endorsings."); }
    },
    run: async (keys, head) => {
        const { hash, header: { level } } = head;
        try {
            if (self.endorsedBlocks.indexOf(head.header.level) < 0) {
                const endorsingRight = await rpc.queryNode(`/chains/main/blocks/head/helpers/endorsing_rights?delegate=${keys.pkh}&level=${level}`, QueryTypes.GET);
                console.log(endorsingRight)
                if(!Array.isArray(endorsingRight)) {
                    console.error("Not able to get Endorsing Rights :(");
                    return;
                }

                if (self.endorsedBlocks.indexOf(level) < 0) {

                    self.endorsedBlocks.push(level);

                    if (endorsingRight.length > 0) {
                        console.log(`Endorsing block [ ${hash} ] on level ${level}...`);

                        const endorse = await self.endorse(keys, head, endorsingRight[0].slots);

                        if(endorse) console.log("Endorsing complete!", endorse);
                        else console.warn("Failed Endorsing :(");
                    }
                }
            }
        }
        catch(e) { console.error(e); };
    },
    endorse: async (keys, head, slots) => {
        const operation = {
            branch: head.hash,
            contents : [
                {          
                    kind : OperationTypes.endorsement.type,
                    level : head.header.level,
                }
            ]
        };

        const forgedOperation = await rpc.queryNode(`/chains/${head.chain_id}/blocks/${head.hash}/helpers/forge/operations`, QueryTypes.POST, operation) as string;

        const signed = crypto.sign(forgedOperation, keys.sk, utils.mergeBuffers(utils.watermark.endorsement, utils.b58decode(head.chain_id, Prefix.chainId)));

        return rpc.injectOperation({
            ...operation,
            protocol: head.protocol,
            signature: signed.edsig,
            signedOperationContents: signed.signedBytes
        });
    }
};

export default self;