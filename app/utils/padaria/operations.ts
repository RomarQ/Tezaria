import rpc from './rpc';
import crypto from './crypto';
import utils, { Prefix } from './utils';

import { OperationsInterface, OperationType, OperationProps } from './operations.d';

export const OperationTypes = {
    endorsement: {
        type: "endorsement" as "endorsement",
        operationCode: 0
    },
    seedNonceRevelation: {
        type: "seed_nonce_revelation" as "seed_nonce_revelation",
        operationCode: 1
    },
    doubleEndorsementEvidence: {
        type: "double_endorsement_evidence" as "double_endorsement_evidence",
        operationCode: 2
    },
    doubleBakingEvidence: {
        type: "double_baking_evidence" as "double_baking_evidence",
        operationCode: 3
    },
    activateAccount: {
        type: "activate_account" as "activate_account",
        operationCode: 4
    },
    proposal: {
        type: "proposal" as "proposal",
        operationCode: 5
    },
    ballot: {
        type: "ballot" as "ballot",
        operationCode: 6
    },
    reveal: {
        type: "reveal" as "reveal",
        operationCode: 7
    },
    transaction: {
        type: "transaction" as "transaction",
        operationCode: 8
    },
    origination: {
        type: "origination" as "origination",
        operationCode: 9
    },
    delegation: {
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
    doubleBakingEvidence: async (keys, evidences) => {
        const head = await rpc.getCurrentHead();

        const operation = {
            branch: head.hash,
            contents: [{
                kind: OperationTypes.doubleBakingEvidence.type,
                bh1: evidences[0],
                bh2: evidences[1]
            }]
        };

        const {forgedConfirmation, ...verifiedOp} = await rpc.forgeOperation(head, operation, true);
        
        const signed = crypto.sign(forgedConfirmation, keys.sk, utils.watermark.genericOperation);
        return await rpc.injectOperation({
            ...verifiedOp,
            signature: signed.edsig,
            signedOperationContents: signed.signedBytes
        });
    },
    doubleEndorsementEvidence: async (keys, evidences) => {
        const head = await rpc.getCurrentHead();

        const operation = {
            branch: head.hash,
            contents: [{
                kind: OperationTypes.doubleEndorsementEvidence.type,
                op1: evidences[0],
                op2: evidences[1]
            }]
        };

        const {forgedConfirmation, ...verifiedOp} = await rpc.forgeOperation(head, operation, true);
        
        const signed = crypto.sign(forgedConfirmation, keys.sk, utils.watermark.genericOperation);
        return await rpc.injectOperation({
            ...verifiedOp,
            signature: signed.edsig,
            signedOperationContents: signed.signedBytes
        });
    },
    transaction: async (source, destinations, keys, fee = self.feeDefaults.low, gasLimit = self.transactionGasCost, storageLimit = self.transactionStorage) => {
        const operations = destinations.reduce((prev, cur) => {
            if (prev[prev.length-1].length === 200) {
                return [
                    ...prev,
                    [
                        {
                            kind: OperationTypes.transaction.type,
                            fee: String(self.feeDefaults.low),
                            gas_limit: String(gasLimit),
                            storage_limit: String(storageLimit),
                            amount: String(cur.amount),
                            destination: cur.destination
                        }
                    ]
                ]
            }

            prev[prev.length-1].push({
                kind: OperationTypes.transaction.type,
                fee: String(self.feeDefaults.low),
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
    awaitForOperationToBeIncluded: async (opHash, prevHeadLevel) => {
        const head = await rpc.getCurrentHead();
        if (prevHeadLevel == head.header.level)
            return await self.awaitForOperationToBeIncluded(opHash, prevHeadLevel);

        for (const opCollection of head.operations) {
            for (const op of opCollection) {
                if (op.hash === opHash)
                    return true;
            }
        }

        return await self.awaitForOperationToBeIncluded(opHash, head.header.level);
    },
    sendOperation: async (source, keys, operation) => {
        while (true) {
            // Wait for operation turn
            if (self.awaitingLock[source]) continue;
            // Cannot run more than one counter operation from the same source at the same time, 
            // otherwise the next operation will be rejected because counter will be too high
            self.awaitingLock[source] = true;

            const {forgedConfirmation, ...verifiedOp} = await self.prepareOperations(source, keys, operation);
            
            const signed = crypto.sign(forgedConfirmation, keys.sk, utils.watermark.genericOperation);

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
    },
    prepareOperations: async (from, keys, operations) => {
        const head = await rpc.getCurrentHead();

        if (!self.contractManagers[from]) {
            self.contractManagers[from] = await rpc.getManager(from);
        }

        let counter = await rpc.getCounter(from);

        /*
        *   Prepare reveal operation if required
        */
        if (!self.contractManagers[from].key) {
            operations = [
                {
                    kind: OperationTypes.reveal.type,
                    fee: String(self.feeDefaults.low),
                    counter: String(++counter),
                    public_key: keys.pk,
                    gas_limit: String(self.revealGasCost),
                    storage_limit: String(self.revealStorage)
                },
                ...operations
            ];
        }

        operations.reduce((prev, cur) => {
            if (self.operationRequiresSource(cur.kind)) {
                if (!cur.source) cur.source = from;
            }
            if (self.operationRequiresCounter(cur.kind)) {
                if (!cur.gas_limit) cur.gas_limit = String(0);
                if (!cur.storage_limit) cur.storage_limit = String(0);
                cur.counter = String(++counter);
            }
            prev.push(cur);
            return prev;
        }, []);

        return rpc.forgeOperation(head, {
            branch: head.hash,
            contents: operations
        });
    },
    forgeOperationLocally: (operation:OperationProps) => {
        let forgeResult = utils.bufferToHex(new Uint8Array([OperationTypes[operation.kind].operationCode]));

        let cleanedSource = utils.bufferToHex(utils.b58decode(operation.source, Prefix.tz1));
        if (cleanedSource.length > 44) {
            // must be less or equal 44 bytes
            throw new Error('provided source is invalid')
        }

        if(cleanedSource.length % 44 > 0)
            forgeResult += '0'.repeat(44 - cleanedSource.length % 44) + cleanedSource;

        forgeResult += utils.numberToZarith(Number(operation.fee))
        forgeResult += utils.numberToZarith(Number(operation.counter))
        forgeResult += utils.numberToZarith(Number(operation.gas_limit))
        forgeResult += utils.numberToZarith(Number(operation.storage_limit))

        switch (OperationTypes[operation.kind].operationCode) {
            case 0: break;
            case 1: break;
            case 2: break;
            case 3: break;
            case 4: break;
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
            case 10: break;
        }
        return forgeResult;
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