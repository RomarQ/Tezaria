import rpc, { QueryTypes } from './rpc';
import utils, { Prefix } from './utils';
import crypto from './crypto';

import {
    EndorderInterface,
    CompletedEndorsingFromServer,
    CompletedEndorsing,
    EndorsingRight,
} from './endorser.d';
import operations, { OperationTypes } from './operations';
import { LogSeverity, LogOrigins } from './logger';

const self:EndorderInterface = {
    /*
    *   States
    */
    endorsedBlocks: [],
    /*
    /*  Functions
    */
    getCompletedEndorsings: async (pkh:string):Promise<CompletedEndorsing[]> => {
        try {
            const res = await rpc.queryTzScan(`/bakings_endorsement/${pkh}`, QueryTypes.GET) as CompletedEndorsingFromServer[];

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

        } catch(e) { console.error(e); }
    },
    getIncomingEndorsings: async pkh => {
        try {
            const metadata = await rpc.getBlockMetadata('head');

            if (!metadata)
                return;
            
            let endorsingRights = await rpc.queryNode(`/chains/main/blocks/head/helpers/endorsing_rights?delegate=${pkh}&cycle=${metadata.level.cycle}`, QueryTypes.GET) as EndorsingRight[];

            endorsingRights = endorsingRights.filter(right => !!right.estimated_time);
                
            /*
            *   Decided to remove the custom API call on this process for sake of simplicity for new bakers

                // This code will possible be used in future versions, since I plan this tool to be customizable.

                const res = await rpc.queryNode(`/incoming_endorsings/?delegate=${pkh}`, QueryTypes.GET) as IncomingEndorsingsFromServer;
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
            */

            return {
                hasData: true,
                cycle: metadata.level.cycle,
                endorsings: endorsingRights
            };

        } catch(e) { console.error("Not able to get Incoming Endorsings."); }
    },
    run: async (pkh, header, logger) => {
        const { level } = header;

        if (self.endorsedBlocks.indexOf(level) < 0) {
            try {
                const endorsingRight = await rpc.queryNode(`/chains/main/blocks/head/helpers/endorsing_rights?delegate=${pkh}&level=${level}`, QueryTypes.GET);

                if (Array.isArray(endorsingRight) && endorsingRight.length > 0) {
                    const endorse = await operations.endorse(header, endorsingRight[0].slots);

                    if (endorse.hash) {
                        logger({
                            message: `Endorsed ${endorsingRight[0].slots.length} slots at level ${level} ${endorse.hash}.`,
                            type: 'success',
                            origin: LogOrigins.ENDORSER
                        });
                    }
                    else {
                        logger({
                            message: `Failed to endorse at level ${level}.`,
                            type: 'error',
                            severity: LogSeverity.VERY_HIGH,
                            origin: LogOrigins.ENDORSER
                        });
                    }
                }
            }
            catch(e) {
                logger({
                    message: `Something went wrong when endorsing at level ${level}.`,
                    type: 'error',
                    severity: LogSeverity.VERY_HIGH,
                    origin: LogOrigins.ENDORSER
                });
                console.error(e);
            };

            self.endorsedBlocks.push(level);
        }
    },
    endorse: async (keys, head, slots) => {
        const operation = {
            branch: head.hash,
            contents: [
                {          
                    kind: OperationTypes.endorsement.type,
                    level: head.header.level
                }
            ]
        } as any;

        if (rpc.network === 'ZERONET')
            operation.contents[0].slot = slots[0];

        const forgedOperation = await rpc.queryNode(`/chains/${head.chain_id}/blocks/${head.hash}/helpers/forge/operations`, QueryTypes.POST, operation) as string;

        const signed = crypto.sign(forgedOperation, utils.mergeBuffers(utils.watermark.endorsement, utils.b58decode(head.chain_id, Prefix.chainId)));

        return rpc.injectOperation({
            ...operation,
            protocol: head.protocol,
            signature: signed.edsig,
            signedOperationContents: signed.signedBytes
        });
    }
};

export default self;