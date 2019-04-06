import storage from './storage';
import utils, { QueryTypes } from './utils';
import baker from './baker';
import endorser from './endorser';

import {
  BakingControllerProps,
  KeysType,
  NonceType,
  BakingControllerStartOptions,
  HeadType
} from './types';

/*
* Constants
*/
const BAKING_INTERVAL = 1000; //ms

const system:BakingControllerProps = {
    //
    // States
    //
    intervalId: null,
    baking: false,
    endorsing: false,
    accusing: false,
    levelOnStart: null,
    noncesToReveal: [],
    //
    // Functions
    //
    firstCycleLevel: (level:number) => (
        Math.floor(level/utils.cycleLength) * utils.cycleLength
    ),
    lastCycleLevel: (level:number) => (
        (Math.floor(level/utils.cycleLength) * utils.cycleLength) + utils.cycleLength
    ),
    revealNonce: async (keys:KeysType, head:HeadType, nonce:NonceType) => {
        const operationArgs = {
            "branch": head.hash,
            "contents" : [
                {          
                    "kind" : "seed_nonce_revelation",
                    "level" : nonce.level,
                    "nonce" : nonce.seed,
                }
            ]
        };
        
        console.log( await utils.queryNode(`/chains/main/blocks/head/helpers/forge/operations`, QueryTypes.POST, operationArgs) );
    },
    revealNonces: async (keys:KeysType, head:HeadType) => {
        if (!head || !head.header) return;

        const nonces =
        system.noncesToReveal.reduce((prev:NonceType[], cur:NonceType) => {
            const revealStart = system.firstCycleLevel(cur.level);
            const revealEnd = system.lastCycleLevel(cur.level);

            if (head.header.level > revealEnd) {
                console.log("End of Reveal, cycle is OVER!");
                return prev;
            } 
            else if (head.header.level >= revealStart && cur.revealed === false) {
                console.log("Revealing nonce ", cur);
                system.revealNonce(keys, head, cur);
                return prev;
            } 

            prev.push(cur);
            return prev;

        }, []);

        if (nonces.length != system.noncesToReveal.length){
            system.noncesToReveal = nonces;
            storage.setBakerNonces(system.noncesToReveal);
        }
    },
    loadNoncesFromStorage: async () => {
        system.noncesToReveal = await storage.getBakerNonces();
    },
    addNonce: async (nonce: NonceType) => {
        system.noncesToReveal.push(nonce);
        await storage.setBakerNonces(system.noncesToReveal);
    },
    run: async (keys:KeysType) => {
        const head = await utils.getCurrentHead();
        
        if (!head || !head.header) return;

        system.revealNonces(keys, head);

        // Stores the current level on Start UP
        if (!system.levelOnStart) system.levelOnStart = head.header.level;

        // Runners
        system.baking ? baker.run(keys, head) : null;
        system.endorsing ? endorser.run(keys, head) : null;
    },
    start: (keys: KeysType, options: BakingControllerStartOptions) => {
        if(!utils.ready) return;

        system.stop();

        system.baking = options.baking;
        system.endorsing = options.endorsing;
        system.accusing = options.accusing;

        system.intervalId = setInterval(() => system.run(keys), BAKING_INTERVAL) as any;
    },
    stop: () => {
        if(system.intervalId) {
            clearInterval(system.intervalId);
            system.intervalId = null;
        }
    }
};

export default system;