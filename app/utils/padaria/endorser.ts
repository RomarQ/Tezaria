import rpc, { QueryTypes } from './rpc';

import {
    EndorderInterface,
    CompletedEndorsing,
    EndorsingRight,
} from './endorser.d';
import operations from './operations';
import utils from './utils';
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
            const completedEndorsings: {endorsing_resume: CompletedEndorsing[]} = 
                await rpc.queryAPI(`
                    query completedBakings($delegate: String!) {
                        endorsing_resume (
                            where: {
                                delegate_pkh: {_eq: $delegate},
                            },
                            limit: 50,
                            order_by: { level: desc }
                        )
                        {
                            level,
                            total_slots,
                            delegate_pkh,
                            timestamp,
                            slots,
                            reward,
                            cycle,
                            endorsed
                        }
                    }
                `, { delegate : pkh });

            if (completedEndorsings && completedEndorsings.endorsing_resume) {
                completedEndorsings.endorsing_resume.forEach(endorsing => (
                    endorsing.reward = utils.parseTEZWithSymbol(Number(endorsing.reward))
                ));
                
                return completedEndorsings.endorsing_resume;
            }

            return [];
        }
        catch(e) {
            throw new Error(`Not able to get Completed Endorsings - ${e}`);
        };
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
    }
};

export default self;