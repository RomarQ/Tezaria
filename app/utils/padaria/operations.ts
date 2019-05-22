import rpc, { QueryTypes } from './rpc';
import crypto from './crypto';
import utils, { Prefix } from './utils';

import {
    OperationsInterface,
    OperationType,
    OperationProps,
    UnsignedOperationProps
} from './operations.d';

export const MAX_BATCH_SIZE = 200;

export const OperationTypes = {
    "endorsement": {
        type: "endorsement" as "endorsement",
        operationCode: 0
    },
    "seed_nonce_revelation": {
        type: "seed_nonce_revelation" as "seed_nonce_revelation",
        operationCode: 1
    },
    "double_endorsement_evidence": {
        type: "double_endorsement_evidence" as "double_endorsement_evidence",
        operationCode: 2
    },
    "double_baking_evidence": {
        type: "double_baking_evidence" as "double_baking_evidence",
        operationCode: 3
    },
    "activate_account": {
        type: "activate_account" as "activate_account",
        operationCode: 4
    },
    "proposal": {
        type: "proposal" as "proposal",
        operationCode: 5
    },
    "ballot": {
        type: "ballot" as "ballot",
        operationCode: 6
    },
    "reveal": {
        type: "reveal" as "reveal",
        operationCode: 7
    },
    "transaction": {
        type: "transaction" as "transaction",
        operationCode: 8
    },
    "origination": {
        type: "origination" as "origination",
        operationCode: 9
    },
    "delegation": {
        type: "delegation" as "delegation",
        operationCode: 10
    }
};

const self: OperationsInterface = {
    /*
    *   Locks any operations from the same source while that same source 
    *   is waiting for an operation to be included
    */
    awaitingLock: {},
    awaitingOperations: {},
    //
    /*
    *   The index of the different components of the protocol's validation passes *)
    *   TODO: ideally, we would like this to be more abstract and possibly part of
    *   the protocol, while retaining the generality of lists *)
    *   Hypothesis : we suppose [List.length validation_passes = 4]
    */
    endorsementsIndex: 0,
    votesIndex: 1,
    anonymousIndex: 2,
    managersIndex: 3,
    contractManagers: {},
    transactionGasCost: '10200',
    transactionStorage: '0',
    delegationGasCost: '10000',
    delegationStorage: '0',
    revealGasCost: '10000',
    revealStorage: '0',
    feeDefaults: {
        low: '1179',
        medium: '1520',
        high: '3000'
    },
    doubleBakingEvidence: async evidences => {
        const header = await rpc.getBlockHeader('head');

        const operation = {
            branch: header.hash,
            contents: [{
                kind: OperationTypes["double_baking_evidence"].type,
                bh1: evidences[0],
                bh2: evidences[1]
            }]
        };

        const {forgedConfirmation, ...verifiedOp} = await rpc.forgeOperation(header, operation, true);
        
        const signed = crypto.sign(forgedConfirmation, utils.watermark.genericOperation);
        return await rpc.injectOperation({
            ...verifiedOp,
            signature: signed.edsig,
            signedOperationContents: signed.signedBytes
        });
    },
    doubleEndorsementEvidence: async evidences => {
        const header = await rpc.getBlockHeader('head');

        const operation = {
            branch: header.hash,
            contents: [{
                kind: OperationTypes["double_endorsement_evidence"].type,
                op1: evidences[0],
                op2: evidences[1]
            }]
        };

        const {forgedConfirmation, ...verifiedOp} = await rpc.forgeOperation(header, operation, true);
        
        const signed = crypto.sign(forgedConfirmation, utils.watermark.genericOperation);
        return await rpc.injectOperation({
            ...verifiedOp,
            signature: signed.edsig,
            signedOperationContents: signed.signedBytes
        });
    },
    revealNonce: async (header, nonce) => {
        const operation = {
            branch: header.hash,
            contents: [{
                kind: OperationTypes["seed_nonce_revelation"].type,
                level: nonce.level,
                nonce: nonce.seed
            }]
        };

        const {forgedConfirmation, ...verifiedOp} = await rpc.forgeOperation(header, operation, true);
        
        const signed = crypto.sign(forgedConfirmation, utils.watermark.genericOperation);
        return rpc.injectOperation({
            ...verifiedOp,
            signature: signed.edsig,
            signedOperationContents: signed.signedBytes
        });
    },
    endorse: async (header, slots) => {
        const operation = {
            branch: header.hash,
            contents: [{
                kind: OperationTypes.endorsement.type,
                level: header.level
            }]
        } as any;

        rpc.network === 'ZERONET' &&
            (operation.contents[0].slot = slots[0]);

        const {forgedConfirmation, ...verifiedOp} = await rpc.forgeOperation(header, operation);

        const signed = crypto.sign(forgedConfirmation, utils.mergeBuffers(utils.watermark.endorsement, utils.b58decode(header.chain_id, Prefix.chainId)));

        return rpc.injectOperation({
            ...verifiedOp,
            signature: signed.edsig,
            signedOperationContents: signed.signedBytes
        });
    },
    transaction: async (source, destinations, keys, fee = self.feeDefaults.low, gasLimit = self.transactionGasCost, storageLimit = self.transactionStorage, batchSize = MAX_BATCH_SIZE) => {
        
        if (batchSize > MAX_BATCH_SIZE)
            batchSize = MAX_BATCH_SIZE

        const operations = destinations.reduce((prev, cur) => {
            if (prev[prev.length-1].length === batchSize) {
                return [
                    ...prev,
                    [
                        {
                            kind: OperationTypes["transaction"].type,
                            fee: String(fee),
                            gas_limit: String(gasLimit),
                            storage_limit: String(storageLimit),
                            amount: String(cur.amount),
                            destination: cur.destination
                        }
                    ]
                ]
            }

            prev[prev.length-1].push({
                kind: OperationTypes["transaction"].type,
                fee: String(fee),
                gas_limit: String(gasLimit),
                storage_limit: String(storageLimit),
                amount: String(cur.amount),
                destination: cur.destination
            });
            
            return prev;

        }, [[]]);

        const ops = [];
        for (const batch of operations) {

            console.log(`START: ${new Date().toJSON()}`)
            const op = await self.sendOperation(source, keys, batch);
            // The result operation hash needs to be a string, otherwise is a error
            if (typeof op.hash !== 'string') {
                console.error('Operation Failed', op);
                continue;
            }

            ops.push(op);
        }
        return ops;
    },
    registerDelegate: keys => {
        const operation = {
            kind: OperationTypes.delegation.type,
            fee: String(self.feeDefaults.low),
            gas_limit: String(self.delegationGasCost),
            storage_limit: String(self.delegationStorage),
            delegate: keys.pkh
        };
        return self.sendOperation(keys.pkh, keys, [operation]);
    },
    activateAccount: (keys, secret) => {
        const operation = {
            kind: OperationTypes["activate_account"].type,
            secret,
            pkh: keys.pkh
        };
        return self.sendOperation(keys.pkh, keys, [operation]);
    },
    awaitForOperationToBeIncluded: async (opHash, prevHeadLevel) => {
        // Wait 2 seconds before checking if the operation was inlcuded
        await new Promise(resolve => setTimeout(resolve, 2000));

        const head = await rpc.getCurrentHead();
        if (!head || prevHeadLevel == head.header.level)
            return await self.awaitForOperationToBeIncluded(opHash, prevHeadLevel);

        for (const opCollection of head.operations) {
            for (const op of opCollection) {
                if (op.hash === opHash)
                    return true;
            }
        }

        return await self.awaitForOperationToBeIncluded(opHash, head.header.level);
    },
    sendOperation: async (source, keys, operation, skipReveal = false) => {
        while (true) {
            // Wait for operation turn
            if (self.awaitingLock[source]) continue;
            // Cannot run more than one counter operation from the same source at the same time, 
            // otherwise the next operation will be rejected because counter will be too high
            self.awaitingLock[source] = true;

            try {
                const preparedOp = await self.prepareOperations(source, keys, operation, skipReveal);

                if (!preparedOp) return;

                const {forgedConfirmation, ...verifiedOp} = preparedOp;
                
                const signed = crypto.sign(forgedConfirmation, utils.watermark.genericOperation);

                const injectedOp = await rpc.injectOperation({
                    ...verifiedOp,
                    signature: signed.edsig,
                    signedOperationContents: signed.signedBytes
                });

                if (typeof injectedOp.hash != 'string') {
                    console.error(injectedOp.hash);
                    self.awaitingLock[source] = false;
                    continue;
                }

                console.log(injectedOp);
                // Wait for operation to be included
                await self.awaitForOperationToBeIncluded(injectedOp.hash, 0);

                self.awaitingLock[source] = false;
                return injectedOp;
            }
            catch (e) {
                console.error(e);
            }

            self.awaitingLock[source] = false;
            return;
        }
    },
    prepareOperations: async (source, keys, operations, skipReveal = false) => {
        const header = await rpc.getBlockHeader('head');

        if (!self.contractManagers[source]) {
            self.contractManagers[source] = await rpc.getManager(source);
        }

        let counter = await rpc.getCounter(source);

        /*
        *   Prepare reveal operation if required
        */
        if (!self.contractManagers[source].key && !skipReveal) {
            self.awaitingLock[source] = false;
            await self.sendOperation(
                source,
                keys,
                [{
                    kind: OperationTypes.reveal.type,
                    fee: String(self.feeDefaults.low),
                    public_key: keys.pk,
                    source,
                    counter: String(++counter),
                    gas_limit: String(self.revealGasCost),
                    storage_limit: String(self.revealStorage)
                }],
                true
            );
        }

        operations.forEach(op => {
            if (self.operationRequiresSource(op.kind)) {
                if (!op.source) op.source = source;
            }
            if (self.operationRequiresCounter(op.kind)) {
                if (!op.gas_limit) op.gas_limit = String(0);
                if (!op.storage_limit) op.storage_limit = String(0);
                op.counter = String(++counter);
            }
        });

        console.log(operations)

        return rpc.forgeOperation(header, {
            branch: header.hash,
            contents: operations
        });
    },
    forgeOperationLocally: (operation:OperationProps) => {
        let forgeResult = utils.bufferToHex(new Uint8Array([OperationTypes[operation.kind].operationCode]));

        if (operation.source) {
            let cleanedSource = utils.bufferToHex(utils.b58decode(operation.source, Prefix.tz1));
            if (cleanedSource.length > 44) {
                // must be less or equal 44 bytes
                throw new Error('provided source is invalid');
            }

            if(cleanedSource.length % 44 > 0)
                forgeResult += '0'.repeat(44 - cleanedSource.length % 44) + cleanedSource;
        }

        typeof operation.fee != 'undefined' &&
            (forgeResult += utils.numberToZarith(Number(operation.fee)));

        typeof operation.counter != 'undefined' &&
            (forgeResult += utils.numberToZarith(Number(operation.counter)));

        typeof operation.gas_limit != 'undefined' && 
            (forgeResult += utils.numberToZarith(Number(operation.gas_limit)));

        typeof operation.storage_limit != 'undefined' && 
            (forgeResult += utils.numberToZarith(Number(operation.storage_limit)));

        switch (OperationTypes[operation.kind].operationCode) {
            case 0: // Endorsement
                typeof operation.slot != 'undefined' &&
                    (forgeResult += utils.bufferToHex(new Uint8Array([operation.slot])));

                typeof operation.level != 'undefined' &&
                    (forgeResult += utils.bufferToHex(utils.int32Buffer(Number(operation.level))));
                break;
            case 1: break;
            case 2: break;
            case 3: break;
            case 4: // Activate Account
                forgeResult += utils.bufferToHex(utils.b58decode(operation.pkh, Prefix.tz1)) + operation.secret;
                break;
            case 5: break;
            case 6: break;
            case 7: // Reveal
                forgeResult += `00${utils.bufferToHex(utils.b58decode(operation.public_key, Prefix.edpk))}`;
                break;
            case 8: // Transaction
                forgeResult += utils.numberToZarith(Number(operation.amount));
                
                let cleanedDestination = '';
                if (operation.destination.toLowerCase().startsWith('kt')) {
                    cleanedDestination = '01' + utils.bufferToHex(utils.b58decode(operation.destination, Prefix.kt)) + '00';
                } else {
                    cleanedDestination = utils.bufferToHex(utils.b58decode(operation.destination, Prefix.tz1));
                }
                
                if(cleanedDestination.length % 44 > 0)
                    cleanedDestination = '0'.repeat(44 - cleanedDestination.length % 44) + cleanedDestination;

                forgeResult += `${cleanedDestination}00`;
                break;
            case 9: break;
            case 10: // Delegation
                forgeResult += `ff00${utils.bufferToHex(utils.b58decode(operation.delegate, Prefix.tz1))}`;
                break;
        }
        return forgeResult;
    },
    /*
    *   We classify operations, sort managers operation by interest and add bad ones at the end
    *   Hypothesis : we suppose that the received manager operations have a valid gas_limit
    *   [classify_operations] classify the operation in 4 lists indexed as such :
    *       - 0 -> Endorsements
    *       - 1 -> Votes and proposals
    *       - 2 -> Anonymous operations
    *       - 3 -> High-priority manager operations.
    *       Returns two list :
    *       - A desired set of operations to be included
    *       - Potentially overflowing operations
    */
    classifyOperations: async (operations, protocol) => {
        const liveBlocks = await rpc.queryNode('/chains/main/blocks/head/live_blocks', QueryTypes.GET) as string[];

        // Remove operations that are too old
        operations = operations.map(operationsType => (
            operationsType.filter(({ branch }:{branch:string}) => liveBlocks.includes(branch))
        ));
        
        // Prepare Operations
        let validationPasses = self.validationPasses();
        let operationsList:UnsignedOperationProps[][] = [];
        for (let i = 0; i < validationPasses.length; i++)
            operationsList.push([] as UnsignedOperationProps[]);

        operations.forEach(operationsType => {
            operationsType.forEach((op:UnsignedOperationProps) => {
                op.protocol = protocol;
                delete op.hash;
                const pass = self.acceptablePass(op);
                operationsList[pass] = [
                    ...operationsList[pass],
                    op
                ];
            });
        });

        const managerOperations = operationsList[self.managersIndex];
        const managerOpsMaxSize = validationPasses[self.managersIndex].maxSize;

        // @TODO: sort_manager_operations 

        return operationsList;
    },
    /*
    *   Sort operation consisdering potential gas and storage usage.
    *   Weight = fee / (max ( (size/size_total), (gas/gas_total))) 
    */
    sortManagerOperations: (operations, maxSize) => {
        // https://gitlab.com/tezos/tezos/blob/07b47c09cc4a245252f1e75ffbe789aa8767f7fb/src/proto_alpha/lib_delegate/client_baking_forge.ml
        const computeWeight = (op:UnsignedOperationProps, fee:number, gas:number):number => {
            let size = op.contents.reduce((prev, cur) => {
                return prev += self.forgeOperationLocally(cur);
            }, utils.bufferToHex(utils.b58decode(op.branch, Prefix.blockHash))).length;
            
            return fee / Math.max(size/maxSize, gas/Number(rpc.networkConstants['hard_gas_limit_per_block']));
        };

        return operations;
    },
    acceptablePass: op => {
        if(!op || !op.contents) return 3;

        switch (op.contents[0].kind) {
            case OperationTypes["endorsement"].type:
                return 0;
            case OperationTypes["ballot"].type || OperationTypes["proposal"].type:
                return 1;
            case OperationTypes["activate_account"].type
                || OperationTypes["double_baking_evidence"].type
                || OperationTypes["double_endorsement_evidence"].type
                || OperationTypes["seed_nonce_revelation"].type:
                return 2;
            default:
                return 3;
        }
    },
    validationPasses: () => {
        // Allow 100 wallet activations or denunciations per block
        let maxAnonymousOps = rpc.networkConstants['max_revelations_per_block'] + 100;
        return [ 
            { 
                maxSize: 32 * 1024,
                maxOp: 32
            }, // 32 endorsements
            { maxSize: 32 * 1024 }, // 32k of voting operations
            { 
                maxSize: maxAnonymousOps * 1024,
                maxOp: maxAnonymousOps
            },
            { maxSize: 512 * 1024 } // 512kB
        ];
    },
    operationRequiresSource: (operationType:OperationType) => (
        ['reveal','proposals','ballot','transaction','origination','delegation'].includes(operationType)
    ),
    operationRequiresCounter: (operationType:OperationType) => (
        ['reveal','transaction','origination','delegation'].includes(operationType)
    ),
};


export * from './operations.d';
export default self;