import storage from '../storage';
import rpc, { QueryTypes } from './rpc';
import utils from './utils';
import baker from './baker';
import endorser from './endorser';
import accuser from './accuser';
import rewarder from './rewarder';
import crypto from './crypto';
import operations from './operations';
import signer from './signer'

import {
    BakingControllerProps,
    BakingControllerStartOptions
} from './bakingController.d';
import { LogOrigins, LogSeverity } from './logger';

const self:BakingControllerProps = {
    //
    // States
    //
    delegate: null,

    running: false,
    baking: false,
    endorsing: false,
    accusing: false,
    rewarding: false,
    levelOnStart: null,
    noncesToReveal: [],
    locked: false,
    /*
    *   This lock will only be used in case of double baking/endorsing to force baker to Stop.
    *
    *   (This should never happen unless there is more than 1 baker running)
    */
    forcedLock: false,
    locks: {
        endorser: false,
        rewarder: false
    },
    //
    // Functions
    //
    load: async keys => {
        if (!signer) return;

        try {
            const delegate = await rpc.queryNode(`/chains/main/blocks/head/context/delegates/${keys.pkh}`, QueryTypes.GET)
                .catch(async () => {
                    await operations.registerDelegate(keys);
                    return;
                });

            if (Array.isArray(delegate)) return;

            if (delegate) {
                delegate.deactivated && await operations.registerDelegate(keys);
                self.delegate = delegate;
                return self.delegate;
            }

            await operations.registerDelegate(keys);
        } catch(e) {
            console.log(e);
        }
     
        return self.delegate;
    },
    revealNonces: async header => {
        const nonces:NonceType[] = [];
        
        await self.noncesToReveal.forEach(async (nonce:NonceType) => {
            const revealStart = utils.firstCycleLevel(nonce.level) + rpc.networkConstants["blocks_per_cycle"];
            const revealEnd = utils.lastCycleLevel(nonce.level) + rpc.networkConstants["blocks_per_cycle"];

            console.log(revealStart, nonce.level, revealEnd);

            if (header.level > revealEnd) {
                console.log("End of Reveal, cycle is OVER!");
                return;
            } 
            else if (header.level >= revealStart) {
                console.log("Revealing nonce ", nonce);
                return await operations.revealNonce(header, nonce)
                    .then(res => {
                        console.log(res);
                    })
                    .catch(e => {
                        console.error(e);
                    });
            }

            nonces.push(nonce);
        });

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
    run: async (keys, logger) => {
        if (self.locked || self.forcedLock || !self.delegate) return;
        self.locked = true;

        const header = await rpc.getBlockHeader('head');
        
        if (!header) {
            self.locked = false;
            return;
        }

        self.revealNonces(header);

        /*
        *   On StartUp avoid running the baker at a middle of a block
        */
        if (self.levelOnStart > header.level) {
            console.log("Waiting for the next level...");
            self.locked = false;
            return;
        }

        //Endorser
        if (self.endorsing) {
            await endorser.run(keys.pkh, header, logger);
        }/* 
        (async () => {
            if (self.endorsing && !self.locks.endorser) {
                self.locks.endorser = true;
                await endorser.run(keys.pkh, header, logger);
                self.locks.endorser = false;
            }
        })(); */
        // Baker
        if (self.baking) {
            baker.run(keys.pkh, header, logger);
        }
        // Rewarder
        (async () => {
            if (self.rewarding && !self.locks.rewarder) {
                self.locks.rewarder = true;
                await rewarder.run(keys, logger);
                self.locks.rewarder = false;
            }
        })();

        self.locked = false;
    },
    start: async (keys: KeysType, options: BakingControllerStartOptions) => {
        if(!rpc.ready) return false;

        self.baking = options.baking;
        self.endorsing = options.endorsing;
        if (self.accusing !== options.accusing) {
            self.accusing = !self.accusing;
            self.accusing ? accuser.run(keys.pkh, options.logger) : accuser.stop();
        }
        self.rewarding = options.rewarding;

        /*
        *   Avoid running more than 1 instance
        */
        if (self.running) return true;

        self.running = true;

        try {
            const header = await rpc.getBlockHeader('head');

            // Stores the current level on Start UP
            if (!self.levelOnStart) 
                self.levelOnStart = header.level+1;
        } catch {
            console.error("Not able to start Baking Service! :(");
        }

        while (self.running) {
            try {
                await rpc.monitorHeads('main', (header, resolve) => {
                    console.log("Block received,", header)
                    self.running
                        ? self.run(keys, options.logger)
                        : resolve();
                });
            }
            catch(e) {
                console.error(e);
            }
        }

        return true;
    },
    stop: () => {
        self.running = false;
        self.baking = false;
        self.endorsing = false;
        self.accusing = false;
        self.rewarding = false;
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

            const tPoW = pows.reduce((p, c) => p+c.attempt, 0);
            resolve((tPoW/Number(((new Date().getTime() - start)/1000).toFixed(3)))/1000);
        });
    },
};

export * from './bakingController.d';
export default self;