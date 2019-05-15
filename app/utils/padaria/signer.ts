import sodium from 'libsodium-wrappers';
import utils, { Prefix } from './utils';

interface SignatureProps {
    sig: Uint8Array;
    edsig: string;
    signedBytes: string;
};

export interface SignerProps {
    sign: (bytes:string, watermark?:Uint8Array) => SignatureProps;
}

export default class Signer implements SignerProps {
    private keys: KeysType = null;

    constructor(keys: KeysType) {
        this.keys = keys;
    }

    sign = (bytes:string, watermark?:Uint8Array) => {
        let buffer = utils.hexToBuffer(bytes);

        buffer = watermark ? utils.mergeBuffers(watermark, buffer) : buffer;

        const sig = sodium.crypto_sign_detached(sodium.crypto_generichash(32, buffer), utils.b58decode(this.keys.sk, Prefix.edsk), 'uint8array');
        const edsig = utils.b58encode(sig, Prefix.edsig);
        const signedBytes = bytes + utils.bufferToHex(sig);
        return {
            sig: sig,
            edsig: edsig,
            signedBytes: signedBytes
        }
    }
}