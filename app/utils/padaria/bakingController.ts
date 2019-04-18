import storage from './storage';
import rpc, { QueryTypes } from './rpc';
import utils from './utils';
import baker from './baker';
import endorser from './endorser';
import accuser from './accuser';
import crypto from './crypto';

import {
  KeysType,
  NonceType
} from './types';

import {
    BakingControllerProps,
    BakingControllerStartOptions
} from './bakingController.d';

/*
* Constants
*/
const BAKING_INTERVAL = 1000; //ms

const self:BakingControllerProps = {
    //
    // States
    //
    intervalId: null,
    baking: false,
    endorsing: false,
    accusing: false,
    levelOnStart: null,
    noncesToReveal: [],
    locks: {
        baker: false,
        endorser: false,
        accuser: false
    },
    //
    // Functions
    //
    revealNonce: async (keys, head, nonce) => {
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
        
        console.log( await rpc.queryNode(`/chains/main/blocks/head/helpers/forge/operations`, QueryTypes.POST, operationArgs) );
    },
    revealNonces: async (keys, head) => {
        if (!head || !head.header) return;

        const nonces =
        self.noncesToReveal.reduce((prev:NonceType[], cur:NonceType) => {
            const revealStart = utils.firstCycleLevel(cur.level);
            const revealEnd = utils.lastCycleLevel(cur.level);

            if (head.header.level > revealEnd) {
                console.log("End of Reveal, cycle is OVER!");
                return prev;
            } 
            else if (head.header.level >= revealStart && cur.revealed === false) {
                console.log("Revealing nonce ", cur);
                self.revealNonce(keys, head, cur);
                return prev;
            } 

            prev.push(cur);
            return prev;

        }, []);

        if (nonces.length != self.noncesToReveal.length){
            self.noncesToReveal = nonces;
            storage.setBakerNonces(self.noncesToReveal);
        }
    },
    loadNoncesFromStorage: async () => {
        self.noncesToReveal = await storage.getBakerNonces();
    },
    addNonce: async (nonce: NonceType) => {
        self.noncesToReveal.push(nonce);
        await storage.setBakerNonces(self.noncesToReveal);
    },
    run: async (keys:KeysType) => {
        const head = await rpc.getCurrentHead();
        
        if (!head || !head.header) return;

        self.revealNonces(keys, head);

        // Stores the current level on Start UP
        if (!self.levelOnStart) self.levelOnStart = head.header.level+1;

        //Endorser
        if (self.endorsing && !self.locks.endorser) {
            self.locks.endorser = true;
            endorser.run(keys, head)
            .then(() => self.locks.endorser = false)
            .catch(() => self.locks.endorser = false);
        }
        // Baker
        if (self.baking && !self.locks.baker) {
            self.locks.baker = true;
            baker.run(keys, head)
            .then(() => self.locks.baker = false)
            .catch(() => self.locks.baker = false);
        }
        // Accuser
        if (self.accusing && !self.locks.accuser) {
            self.locks.accuser = true;
            accuser.run(keys, head)
            .then(() => self.locks.accuser = false)
            .catch(() => self.locks.accuser = false);
        }
    },
    start: (keys: KeysType, options: BakingControllerStartOptions) => {
        if(!rpc.ready) return;

        self.stop();

        self.baking = options.baking;
        self.endorsing = options.endorsing;
        self.accusing = options.accusing;

        self.intervalId = setInterval(() => self.run(keys), BAKING_INTERVAL) as any;
    },
    stop: () => {
        if(self.intervalId) {
            clearInterval(self.intervalId);
            self.intervalId = null;
        }
    },
    checkHashPower: () => {
        const tests:number[][] = [];
        for (let i = 0; i < 5; i++){
            tests[i] = [];
            for (let ii = 0; ii < 131; ii++){
                tests[i].push(Math.floor(Math.random()*256));
            }
        }
        return new Promise(async (resolve, reject) => {
            const start = Date.now();
            const pows = [];
            pows[0] = await crypto.POW(utils.bufferToHex(new Uint8Array(tests[0])), 0, "4e07e55960daee56883d231b3c41f223733f58be90b5a1ee2147df8de5b8ac86") as any;
            pows[1] = await crypto.POW(utils.bufferToHex(new Uint8Array(tests[1])), 0, "4e07e55960daee56883d231b3c41f223733f58be90b5a1ee2147df8de5b8ac86") as any;
            pows[2] = await crypto.POW(utils.bufferToHex(new Uint8Array(tests[2])), 0, "4e07e55960daee56883d231b3c41f223733f58be90b5a1ee2147df8de5b8ac86") as any;
            pows[3] = await crypto.POW(utils.bufferToHex(new Uint8Array(tests[3])), 0, "4e07e55960daee56883d231b3c41f223733f58be90b5a1ee2147df8de5b8ac86") as any;
            pows[4] = await crypto.POW(utils.bufferToHex(new Uint8Array(tests[4])), 0, "4e07e55960daee56883d231b3c41f223733f58be90b5a1ee2147df8de5b8ac86") as any;
            
            const tPoW = pows.reduce((p, c) => p+c.att, 0);
            resolve((tPoW/Number(((new Date().getTime() - start)/1000).toFixed(3)))/1000);
            
        });
    },
};

export * from './bakingController.d';
export default self;