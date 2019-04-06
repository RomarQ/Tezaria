import bip39 from 'bip39';
import bs58check from 'bs58check';
import sodium from 'libsodium-wrappers';
import pbkdf2 from 'pbkdf2';

import node from './utils';

import { KeysType } from './types';

const DERIVATION_ITERATIONS = 32768;

// https://gitlab.com/tezos/tezos/blob/master/src/lib_crypto/base58.ml
export const Prefix = {
    tz1: new Uint8Array([6, 161, 159]),                 // 36 bytes
    tz2: new Uint8Array([6, 161, 161]),
    tz3: new Uint8Array([6, 161, 164]),
    edsk: new Uint8Array([43, 246, 78, 7]),             // 54 bytes for b58check_encoding / 98 in raw format
    edpk: new Uint8Array([13, 15, 37, 217]),            // 54 bytes
    edesk: new Uint8Array([7, 90, 60, 179, 41]),        // 88 bytes ed25519
    spesk: new Uint8Array([9, 237, 241, 174, 150]),     // 88 bytes secp256k1
    p2esk: new Uint8Array([9, 48, 57, 115, 171]),       // 88 bytes p256
    //spsk
    //sppk
    //p2sk
    //p2pk
    edsig: new Uint8Array([9, 245, 205, 134, 18]),      // 99 bytes

    chain_id: new Uint8Array([87, 82, 0]),              // 15 bytes Net[...]
    nce: new Uint8Array([69, 220, 169]),

    /*
    (* 32 *)
    let block_hash = "\001\052" (* B(51) *)
    let operation_hash = "\005\116" (* o(51) *)
    let operation_list_hash = "\133\233" (* Lo(52) *)
    let operation_list_list_hash = "\029\159\109" (* LLo(53) *)
    let protocol_hash = "\002\170" (* P(51) *)
    let context_hash = "\079\199" (* Co(52) *)

    (* 20 *)
    let ed25519_public_key_hash = "\006\161\159" (* tz1(36) *)
    let secp256k1_public_key_hash = "\006\161\161" (* tz2(36) *)
    let p256_public_key_hash = "\006\161\164" (* tz3(36) *)

    (* 16 *)
    let cryptobox_public_key_hash = "\153\103" (* id(30) *)

    (* 32 *)
    let ed25519_seed = "\013\015\058\007" (* edsk(54) *)
    let ed25519_public_key = "\013\015\037\217" (* edpk(54) *)
    let secp256k1_secret_key = "\017\162\224\201" (* spsk(54) *)
    let p256_secret_key = "\016\081\238\189" (* p2sk(54) *)

    (* 56 *)
    let ed25519_encrypted_seed = "\007\090\060\179\041" (* edesk(88) *)
    let secp256k1_encrypted_secret_key = "\009\237\241\174\150" (* spesk(88) *)
    let p256_encrypted_secret_key = "\009\048\057\115\171" (* p2esk(88) *)

    (* 33 *)
    let secp256k1_public_key = "\003\254\226\086" (* sppk(55) *)
    let p256_public_key = "\003\178\139\127" (* p2pk(55) *)
    let secp256k1_scalar = "\038\248\136" (* SSp(53) *)
    let secp256k1_element = "\005\092\000" (* GSp(54) *)

    (* 64 *)
    let ed25519_secret_key = "\043\246\078\007" (* edsk(98) *)
    let ed25519_signature = "\009\245\205\134\018" (* edsig(99) *)
    let secp256k1_signature =  "\013\115\101\019\063" (* spsig1(99) *)
    let p256_signature =  "\054\240\044\052" (* p2sig(98) *)
    let generic_signature = "\004\130\043" (* sig(96) *)
    */
}

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
    b58encode: (payload:Uint8Array, prefix:Uint8Array):string => {
        const buffer = new Uint8Array(prefix.length + payload.length);
        buffer.set(prefix);
        buffer.set(payload, prefix.length);
        return bs58check.encode(buffer);
    },
    b58decode: (encoded:string, prefix:Uint8Array):Uint8Array => (
        bs58check.decode(encoded).slice(prefix.length)
    ),
    seedToKeys: (seed: Uint8Array): KeysType => {
        if (!seed) throw new Error('Crypto: Seed is Missing.');

        const keys = sodium.crypto_sign_seed_keypair(seed);
        return {
            sk: crypto.b58encode(keys.privateKey, Prefix.edsk),
            pk: crypto.b58encode(keys.publicKey, Prefix.edpk),
            pkh: crypto.b58encode(sodium.crypto_generichash(20, keys.publicKey), Prefix.tz1),
            encrypted: false
        };
    },
    encryptSK: (keys:KeysType, passphrase:string):KeysType => {
        // Decrypted private key
        const sk_decoded = crypto.b58decode(keys.sk, Prefix.edsk);
        const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

        const key = pbkdf2.pbkdf2Sync(passphrase, new Buffer(nonce), DERIVATION_ITERATIONS, 32, 'sha512');

        const encryptedSK = sodium.crypto_secretbox_easy(sk_decoded, nonce, key);
        const nonceAndEsk = crypto.bufferToHex(crypto.mergeBuffer(nonce, encryptedSK));

        return {
            ...keys,
            sk: nonceAndEsk,
            encrypted: true
        }
    },
    decryptSK: (keys:KeysType, passphrase:string):KeysType => {
        const nonceAndEsk = crypto.hexToBuffer(keys.sk);

        const nonce = nonceAndEsk.slice(0, sodium.crypto_secretbox_NONCEBYTES);
        const esk = nonceAndEsk.slice(sodium.crypto_secretbox_NONCEBYTES);
        const key = pbkdf2.pbkdf2Sync(passphrase, new Buffer(nonce), DERIVATION_ITERATIONS, 32, 'sha512');

        const sk = crypto.b58encode(sodium.crypto_secretbox_open_easy(esk, nonce, key), Prefix.edsk);

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
        const esk_decoded = crypto.b58decode(esk_encoded, Prefix.edesk);

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
            sk: crypto.b58encode(keys.privateKey, Prefix.edsk),
            pk: crypto.b58encode(keys.publicKey, Prefix.edpk),
            pkh: crypto.b58encode(sodium.crypto_generichash(20, keys.publicKey), Prefix.tz1),
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
                    const sk_decoded = crypto.b58decode(sk_or_seed, Prefix.edsk);
                    return {
                        sk: sk_or_seed,
                        pk: crypto.b58encode(
                            sk_decoded.slice(32),
                            Prefix.edpk
                        ),
                        pkh: crypto.b58encode(
                            sodium.crypto_generichash(20, sk_decoded.slice(32)),
                            Prefix.tz1
                        ),
                        encrypted: false
                    };
                // Is the Seed
                } else if (sk_or_seed.length === 54) {
                    return crypto.seedToKeys(crypto.b58decode(sk_or_seed, Prefix.edsk));
                }
                break;
            default:
                throw new Error('Crypto: Invalid prefix for a key encoding.');
        }

        throw new Error('Crypto: Invalid Secret.');
    },
    sign: (bytes:string, sk:string, watermark?:Uint8Array) => {
        let buffer = crypto.hexToBuffer(bytes);

        buffer = watermark ? crypto.mergeBuffer(watermark, buffer) : buffer;

        const sig = sodium.crypto_sign_detached(sodium.crypto_generichash(32, buffer), crypto.b58decode(sk, Prefix.edsk), 'uint8array');
        const edsig = crypto.b58encode(sig, Prefix.edsig);
        const signedBytes = bytes + crypto.bufferToHex(sig);
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
            crypto.b58decode(address, Prefix.tz1);
            return true;
        }
        catch (e) {
            return false;
        }
    },
    checkHash: (buffer:Uint8Array) => (
        crypto.stampCheck(sodium.crypto_generichash(32, buffer)) <= node.networkConstants['proof_of_work_threshold']
    ),
    stampCheck: (hash:Uint8Array) => {
        let value, i = value = 0;
        for (; i < 8; i++) value = value * 256 + hash[i];
        return value;
    },
    bufferToHex: (buffer:Uint8Array) => (
        new Uint8Array(buffer).reduce((prev: string[], cur:number) => {
            prev.push(`00${cur.toString(16)}`.slice(-2));
            return prev;
        }, []).join('')
    ),
    seedHash: (seed:string) => (
        sodium.crypto_generichash(32, crypto.hexToBuffer(seed))
    ),
    hexNonce: (size:number) => {
        const chars = '0123456789abcedf';
        let hex = '';
        while (size--) hex += chars[(Math.random() * 16) | 0];
        return hex;
    },
    nonceHash: (nonce:Uint8Array) => (
        crypto.b58encode(nonce, Prefix.nce)
    ),
    hexToBuffer : (hex:string) => new Uint8Array(
        hex.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16))
    ),
    POW: (forged:string, priority:number, seed_hex:string) => {
        const 
            protocolData = node.createProtocolData(priority, node.PowHeader, '00000000', seed_hex),
            blockbytes = forged + protocolData,
            hashBuffer = crypto.hexToBuffer(blockbytes + "0".repeat(128)),
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
                    let hex = crypto.bufferToHex(hashBuffer);
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
    mergeBuffer: (b1:Uint8Array, b2:Uint8Array) => {
        const newBuffer = new Uint8Array(b1.length + b2.length);
        newBuffer.set(b1);
        newBuffer.set(b2, b1.length);
        return newBuffer;
    },
}

export default crypto;