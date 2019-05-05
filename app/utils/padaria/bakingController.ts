import storage from '../storage';
import rpc, { QueryTypes } from './rpc';
import utils from './utils';
import baker from './baker';
import endorser from './endorser';
import accuser from './accuser';
import rewarder from './rewarder';
import crypto from './crypto';
import operations from './operations';

import {
    BakingControllerProps,
    BakingControllerStartOptions,
    DelegateProps
} from './bakingController.d';

/*
* Constants
*/
const BAKING_INTERVAL = 1000; //ms

const self:BakingControllerProps = {
    //
    // States
    //
    delegate: {},

    intervalId: null,
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
    load: async () => {
        if (!crypto.keys) return;

        self.delegate = await rpc.queryNode(`/chains/main/blocks/head/context/delegates/${crypto.keys.pkh}`, QueryTypes.GET) as DelegateProps;

        if (self.delegate.deactivated) {
            await operations.registerDelegate(crypto.keys);
            return false;
        }

        return true;
    },
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
    run: async (keys, logger) => {
        if (self.locked || self.forcedLock || self.delegate.deactivated) return;
        self.locked = true;

        const head = await rpc.getCurrentHead();
        
        if (!head || !head.header) {
            self.locked = false;
            return;
        }

        baker.pendingBlocks = baker.pendingBlocks.reduce((prev, block) => {
            /*
            *   Every block needs to be injected before their respective level starts
            */
            if(block.level <= head.header.level) {
                logger({ 
                    message: `Block ${block.level} was too late to be injected.`,
                    type: 'error',
                    severity: LogSeverity.NORMAL
                });
                return prev;
            }

            /*
            *   Inject the block if the "Baking Right Timestamp" for this block is now or has already passed
            */
            if(new Date() >= new Date(block.timestamp))
            {
                rpc.queryNode('/injection/block/?chain=main', QueryTypes.POST, block.data)
                    .then((injectionHash:string) => {
                        if(!injectionHash) {
                            logger({ 
                                message: 'Inject failed',
                                type: 'error',
                                severity: LogSeverity.NORMAL
                            });
                        }
                        
                        baker.injectedBlocks.push(injectionHash);

                        if(block.seed)
                        {
                            self.addNonce({
                                hash: injectionHash,
                                seedNonceHash: block.seed_nonce_hash,
                                seed: block.seed,
                                level: block.level,
                                revealed: false
                            });
                        }
                
                        console.log(`Baked ${injectionHash} block at level ${block.level}`);
                    })
                    .catch((e:Error) => console.error(e));
            }
            else prev.push(block);

            return prev;
        }, []);

        self.revealNonces(keys, head);

        /*
        *   On StartUp avoid running the baker at a middle of a block
        */
        if (self.levelOnStart > head.header.level) {
            console.log("Waiting for the next level...");
            self.locked = false;
            return;
        }

        //Endorser
        (async () => {
            if (self.endorsing && !self.locks.endorser) {
                self.locks.endorser = true;
                await endorser.run(keys, head);
                self.locks.endorser = false;
            }
        })();
        // Baker
        (async () => {
            if (self.baking && !self.locks.baker) {
                self.locks.baker = true;
                await baker.run(keys, head, logger);
                self.locks.baker = false;
            }
        })();
        // Accuser
        (async () => {
            if (self.accusing && !self.locks.accuser) {
                self.locks.accuser = true;
                await accuser.run(keys, logger);
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

        self.stop();

        self.baking = options.baking;
        self.endorsing = options.endorsing;
        self.accusing = options.accusing;
        self.rewarding = options.rewarding;

        try {
            const head = await rpc.getCurrentHead();

            // Stores the current level on Start UP
            if (!self.levelOnStart) 
                self.levelOnStart = head.header.level+1;
        } catch {
            console.error("Not able to start Baking Service! :(");
        }

        self.intervalId = setInterval(() => self.run(keys, options.logger), BAKING_INTERVAL) as any;

        return true;
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