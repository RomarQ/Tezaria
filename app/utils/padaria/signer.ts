import sodium from 'libsodium-wrappers'
import utils, { Prefix } from './utils'

interface SignatureProps {
  sig: Uint8Array
  edsig: string
  signedBytes: string
}

export interface SignerProps {
  sign: (bytes: string, watermark?: Uint8Array) => Promise<SignatureProps>
}

export default class Signer {
  public sign: (
    bytes: string,
    watermark?: Uint8Array
  ) => Promise<SignatureProps>

  public constructor(sk: string, HWSigner?: (hash: string) => string) {
    const privateKey = sk ? utils.b58decode(String(sk), Prefix.edsk) : null

    this.sign = async (bytes: string, watermark?: Uint8Array) => {
      let buffer = utils.hexToBuffer(bytes)

      typeof watermark !== 'undefined' &&
        (buffer = utils.mergeBuffers(watermark, buffer))

      let sig
      if (typeof HWSigner !== 'undefined') {
        const signature = await HWSigner(
          utils.bufferToHex(sodium.crypto_generichash(32, buffer))
        )
        if (signature) {
          sig = utils.hexToBuffer(signature)
        }
      } else {
        sig = sodium.crypto_sign_detached(
          sodium.crypto_generichash(32, buffer),
          privateKey,
          'uint8array'
        )
      }

      console.log(sig)

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
