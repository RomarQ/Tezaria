import sodium from 'libsodium-wrappers'
import utils, { Prefix } from './utils'

interface SignatureProps {
	sig: Uint8Array
	edsig: string
	signedBytes: string
}

export interface SignerProps {
	sign: (bytes: string, watermark?: Uint8Array) => SignatureProps
}

export default class Signer {
	sign: (bytes: string, watermark?: Uint8Array) => SignatureProps

	constructor (sk: string) {
	  this.sign = function (bytes: string, watermark?: Uint8Array) {
	    const secret = String(sk)
	    let buffer = utils.hexToBuffer(bytes)

	    typeof watermark !== 'undefined' &&
				(buffer = utils.mergeBuffers(watermark, buffer))

	    const sig = sodium.crypto_sign_detached(
	      sodium.crypto_generichash(32, buffer),
	      utils.b58decode(secret, Prefix.edsk),
	      'uint8array'
	    )
	    const edsig = utils.b58encode(sig, Prefix.edsig)
	    const signedBytes = bytes + utils.bufferToHex(sig)
	    return {
	      sig,
	      edsig,
	      signedBytes
	    }
	  }
	}
}
