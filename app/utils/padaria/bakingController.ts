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

/*
* Constants
*/
const BAKING_INTERVAL = 1000; //ms

const self:BakingControllerProps = {
    //
    // States
    //
    delegate: null,

    intervalId: null,
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
        baker: false,
        endorser: false,
        accuser: false,
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

        const nonces = await 
            self.noncesToReveal.reduce((prev:NonceType[], cur:NonceType) => {
                const revealStart = utils.firstCycleLevel(cur.level);
                const revealEnd = utils.lastCycleLevel(cur.level);

                console.log(revealStart, cur.level, revealEnd);

                if (header.level > revealEnd) {
                    console.log("End of Reveal, cycle is OVER!");
                    return prev;
                } 
                else if (header.level >= revealStart) {
                    console.log("Revealing nonce ", cur);
                    operations.revealNonce(header, cur)
                        .then(res => console.log(res))
                        .catch(e => console.error(e));
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
    run: async (keys, logger) => {
        if (self.locked || self.forcedLock || !self.delegate) return;
        self.locked = true;

        const header = await rpc.getBlockHeader('head');
        
        if (!header) {
            self.locked = false;
            return;
        }

/*         baker.pendingBlocks = baker.pendingBlocks.reduce((prev, block) => {
            /*
            *   Inject the block if the "Baking Right Timestamp" for this block is now or has already passed
            
            if(new Date() >= new Date(block.timestamp))
            {
                rpc.queryNode('/injection/block/?chain=main', QueryTypes.POST, block.data)
                    .then((injectionHash:string) => {
                        if(!injectionHash) {
                            logger({ 
                                message: 'Inject failed',
                                type: 'error',
                                severity: LogSeverity.HIGH,
                                origin: LogOrigins.BAKER
                            });
                            return;
                        }
                        
                        baker.injectedBlocks.push(injectionHash);

                        if(block.seed)
                        {
                            self.addNonce({
                                hash: injectionHash,
                                seedNonceHash: block.seed_nonce_hash,
                                seed: block.seed,
                                level: block.level
                            });
                        }
                        
                        logger({ 
                            message: `Baked ${injectionHash} block at level ${block.level}`,
                            type: 'success',
                            severity: LogSeverity.HIGH,
                            origin: LogOrigins.BAKER
                        });
                    })
                    .catch((e:Error) => console.error(e));
            }
            else prev.push(block);

            return prev;
        }, []); */

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
        (async () => {
            if (self.endorsing && !self.locks.endorser) {
                self.locks.endorser = true;
                await endorser.run(keys.pkh, header, logger);
                self.locks.endorser = false;
            }
        })();
        // Baker
        if (self.baking) {
            baker.run(keys.pkh, header, logger);
        }
        // Accuser
        (async () => {
            if (self.accusing && !self.locks.accuser) {
                self.locks.accuser = true;
                await accuser.run(keys.pkh, logger);
                self.locks.accuser = false;
            }
        })();
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

        self.running = true;
        self.baking = options.baking;
        self.endorsing = options.endorsing;
        self.accusing = options.accusing;
        self.rewarding = options.rewarding;

        try {
            const header = await rpc.getBlockHeader('head');

            // Stores the current level on Start UP
            if (!self.levelOnStart) 
                self.levelOnStart = header.level+1;
        } catch {
            console.error("Not able to start Baking Service! :(");
        }

        while (self.running) {
            await rpc.monitorHeads('main', (header, resolve) => {
                console.warn(header.hash);
                self.running
                    ? self.run(keys, options.logger)
                    : resolve();
            });
        }

        //self.intervalId = setInterval(() => self.run(keys, options.logger), BAKING_INTERVAL) as any;

        return true;
    },
    stop: () => {
        self.running = false;
        self.baking = false;
        self.endorsing = false;
        self.accusing = false;
        self.rewarding = false;

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

            const tPoW = pows.reduce((p, c) => p+c.attempt, 0);
            resolve((tPoW/Number(((new Date().getTime() - start)/1000).toFixed(3)))/1000);
        });
    },
};

export * from './bakingController.d';
export default self;