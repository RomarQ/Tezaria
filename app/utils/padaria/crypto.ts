import bip39 from 'bip39';
import sodium from 'libsodium-wrappers';
import pbkdf2 from 'pbkdf2';

import rpc from './rpc';
import utils, { Prefix } from './utils';

import { KeysType } from './types';

const DERIVATION_ITERATIONS = 32768;

const crypto = {
    //
    subtle: window ? window.crypto.subtle : undefined,
    //
    mnemonicToSeed: (mnemonic: string, passphrase: string = "") => {
        if (!bip39.validateMnemonic(mnemonic)) throw new Error('Crypto: Mnemonic is Invalid.');

        return bip39.mnemonicToSeed(mnemonic, passphrase).slice(0, 32);
    },
    isEdesk: (secret:string) => (
        secret.substring(0, 5) === "edesk"
    ),
    isEdsk: (secret:string) => (
        secret.substring(0, 4) === "edsk"
    ),
    seedToKeys: (seed: Uint8Array): KeysType => {
        if (!seed) throw new Error('Crypto: Seed is Missing.');

        const keys = sodium.crypto_sign_seed_keypair(seed);
        return {
            sk: utils.b58encode(keys.privateKey, Prefix.edsk),
            pk: utils.b58encode(keys.publicKey, Prefix.edpk),
            pkh: utils.b58encode(sodium.crypto_generichash(20, keys.publicKey), Prefix.tz1),
            encrypted: false
        };
    },
    encryptSK: (keys:KeysType, passphrase:string):KeysType => {
        // Decrypted private key
        const sk_decoded = utils.b58decode(keys.sk, Prefix.edsk);
        const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

        const key = pbkdf2.pbkdf2Sync(passphrase, new Buffer(nonce), DERIVATION_ITERATIONS, 32, 'sha512');

        const encryptedSK = sodium.crypto_secretbox_easy(sk_decoded, nonce, key);
        const nonceAndEsk = utils.bufferToHex(utils.mergeBuffers(nonce, encryptedSK));

        return {
            ...keys,
            sk: nonceAndEsk,
            encrypted: true
        }
    },
    decryptSK: (keys:KeysType, passphrase:string):KeysType => {
        const nonceAndEsk = utils.hexToBuffer(keys.sk);

        const nonce = nonceAndEsk.slice(0, sodium.crypto_secretbox_NONCEBYTES);
        const esk = nonceAndEsk.slice(sodium.crypto_secretbox_NONCEBYTES);
        const key = pbkdf2.pbkdf2Sync(passphrase, new Buffer(nonce), DERIVATION_ITERATIONS, 32, 'sha512');

        const sk = utils.b58encode(sodium.crypto_secretbox_open_easy(esk, nonce, key), Prefix.edsk);

        return {
            ...keys,
            sk,
            encrypted: false
        };
    },
    getKeysFromMnemonic: (mnemonic: string, passphrase: string):KeysType => (
        crypto.seedToKeys(crypto.mnemonicToSeed(mnemonic, passphrase))
    ),
    getKeysFromEncSeed: async (esk_encoded:string, password:string):Promise<KeysType> => {
        if (!esk_encoded || !password || !crypto.subtle) return null;

        // AES in CBC [Salt is the first 8 bytes]
        const esk_decoded = utils.b58decode(esk_encoded, Prefix.edesk);

        // salt is 64 bits long
        const salt = esk_decoded.slice(0, 8);
        // Key without salt
        const esk = esk_decoded.slice(8);

/*         const importedKey = await crypto.subtle.importKey(
            'raw',                              // format
            new TextEncoder().encode(password), // keyData 
            'PBKDF2',                           // algorithm
            false,                              // extractable
            ['deriveBits']                      // usages
        );

        const derivation = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                hash: 'SHA-512',
                salt: salt,
                iterations: DERIVATION_ITERATIONS,
            },                        // algorithm
            importedKey,              // baseKey
            256                       // length
        ); */
        let key = pbkdf2.pbkdf2Sync(password, new Buffer(salt), DERIVATION_ITERATIONS, 32, 'sha512');

        const keys = sodium.crypto_sign_seed_keypair(
            sodium.crypto_secretbox_open_easy(
                esk, 
                new Uint8Array(24),
                new Uint8Array(key)
            )
        );

        return {
            sk: utils.b58encode(keys.privateKey, Prefix.edsk),
            pk: utils.b58encode(keys.publicKey, Prefix.edpk),
            pkh: utils.b58encode(sodium.crypto_generichash(20, keys.publicKey), Prefix.tz1),
            encrypted: false
        };
    },
    getKeysFromDecSecret: (sk_or_seed:string):KeysType => {
        const prefix = sk_or_seed.substr(0,4);
        // Only supports Ed25519 for now
        switch(prefix){
            case 'edsk':
                // Is the Secret key
                if (sk_or_seed.length === 98) {
                    const sk_decoded = utils.b58decode(sk_or_seed, Prefix.edsk);
                    return {
                        sk: sk_or_seed,
                        pk: utils.b58encode(
                            sk_decoded.slice(32),
                            Prefix.edpk
                        ),
                        pkh: utils.b58encode(
                            sodium.crypto_generichash(20, sk_decoded.slice(32)),
                            Prefix.tz1
                        ),
                        encrypted: false
                    };
                // Is the Seed
                } else if (sk_or_seed.length === 54) {
                    return crypto.seedToKeys(utils.b58decode(sk_or_seed, Prefix.edsk));
                }
                break;
            default:
                throw new Error('Crypto: Invalid prefix for a key encoding.');
        }

        throw new Error('Crypto: Invalid Secret.');
    },
    sign: (bytes:string, sk:string, watermark?:Uint8Array) => {
        let buffer = utils.hexToBuffer(bytes);

        buffer = watermark ? utils.mergeBuffers(watermark, buffer) : buffer;

        const sig = sodium.crypto_sign_detached(sodium.crypto_generichash(32, buffer), utils.b58decode(sk, Prefix.edsk), 'uint8array');
        const edsig = utils.b58encode(sig, Prefix.edsig);
        const signedBytes = bytes + utils.bufferToHex(sig);
        return {
            sig: sig,
            edsig: edsig,
            signedBytes: signedBytes
        }
    },
    generateMnemonic: () => (
        bip39.generateMnemonic(160)
    ),
    checkAddress: (address:string) => {
        try {
            utils.b58decode(address, Prefix.tz1);
            return true;
        }
        catch (e) {
            return false;
        }
    },
    checkHash: (buffer:Uint8Array) => (
        String(crypto.stampCheck(sodium.crypto_generichash(32, buffer))) <= rpc.networkConstants['proof_of_work_threshold']
    ),
    stampCheck: (hash:Uint8Array) => {
        let value, i = value = 0;
        for (; i < 8; i++) value = value * 256 + hash[i];
        return value;
    },
    seedHash: (seed:string) => (
        sodium.crypto_generichash(32, utils.hexToBuffer(seed))
    ),
    hexNonce: (size:number) => {
        const chars = '0123456789abcedf';
        let hex = '';
        while (size--) hex += chars[(Math.random() * 16) | 0];
        return hex;
    },
    nonceHash: (nonce:Uint8Array) => (
        utils.b58encode(nonce, Prefix.nce)
    ),
    POW: (forged:string, priority:number, seed_hex:string) => {
        const 
            protocolData = utils.createProtocolData(priority, rpc.PowHeader, '00000000', seed_hex),
            blockbytes = forged + protocolData,
            hashBuffer = utils.hexToBuffer(blockbytes + "0".repeat(128)),
            forgedLength = forged.length/2,
            priorityLength = 2,
            powHeaderLength = 4,
            protocolOffset = forgedLength + priorityLength + powHeaderLength,
            powLength = 4,
            syncBatchSize = 2000;

        console.log(protocolData);
        return new Promise(resolve => {
            (function rec(att = 0, syncAtt = 0) {
                att++;
                syncAtt++;
                for (let i = powLength-1; i >= 0; i--) {
                    if (hashBuffer[protocolOffset+i] == 255) hashBuffer[protocolOffset+i] = 0;
                    else {
                        hashBuffer[protocolOffset+i]++;
                        break;
                    }
                }
                if (crypto.checkHash(hashBuffer)) {
                    let hex = utils.bufferToHex(hashBuffer);
                    resolve({
                        blockbytes: hex.substr(0, hex.length-128), 
                        att
                    });
                }
                else {
                    if (syncAtt < syncBatchSize) rec(att, syncAtt);
                    else setImmediate(rec, att, 0);
                }
            })();
        });
    },
}

export default crypto;