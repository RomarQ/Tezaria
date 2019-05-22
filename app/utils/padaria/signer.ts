import sodium from 'libsodium-wrappers';
import utils, { Prefix } from './utils';

interface SignatureProps {
    sig: Uint8Array;
    edsig: string;
    signedBytes: string;
};

export interface SignerProps {
    sign: (bytes:string, watermark?:Uint8Array) => SignatureProps;
    t: () => void;
}

export default class Signer implements SignerProps {
    private secret: string = null;

    constructor(sk:string) {
        this.secret = String(sk);
    }

    t = () => console.log(this.secret);
    sign = (bytes:string, watermark?:Uint8Array) => {
        let buffer = utils.hexToBuffer(bytes);

        typeof watermark != 'undefined' && (buffer = utils.mergeBuffers(watermark, buffer));

        const sig = sodium.crypto_sign_detached(sodium.crypto_generichash(32, buffer), utils.b58decode(this.secret, Prefix.edsk), 'uint8array');
        const edsig = utils.b58encode(sig, Prefix.edsig);
        const signedBytes = bytes + utils.bufferToHex(sig);
        return {
            sig,
            edsig,
            signedBytes
        }
    }
}