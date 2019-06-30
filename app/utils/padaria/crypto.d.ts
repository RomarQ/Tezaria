import { SignerProps } from './signer'

export interface CryptoInterface {
	/*
	 *   States
	 */
	signer: SignerProps
	/*
	 *   Functions
	 */
	loadSigner: (sk: string) => void
	mnemonicToSeed: (mnemonic: string, passphrase: string) => Promise<Buffer>
	isEdesk: (secret: string) => boolean
	isEdsk: (secret: string) => boolean
	seedToKeys: (seed: Uint8Array) => KeysProps
	encryptSK: (keys: KeysProps, passphrase: string) => KeysProps
	decryptSK: (keys: KeysProps, passphrase: string) => KeysProps
	getKeysFromMnemonic: (
		mnemonic: string,
		passphrase: string
	) => Promise<KeysProps>
	getKeysFromEncSeed: (esk_encoded: string, password: string) => KeysProps
	getKeysFromDecSecret: (sk_or_seed: string) => KeysProps
	sign: (bytes: string, watermark?: Uint8Array) => SignatureProps
	generateMnemonic: () => string
	checkAddress: (address: string) => boolean
	checkHash: (buffer: Uint8Array) => boolean
	stampCheck: (hash: Uint8Array) => number
	seedHash: (seed: string) => Uint8Array
	hexNonce: (size: number) => string
	nonceHash: (nonce: Uint8Array) => string
	POW: (
		forged: string,
		priority: number,
		seedHex: string
	) => Promise<{ blockBytes: string; attempt: number }>
}

export interface SignatureProps {
	sig: Uint8Array
	edsig: string
	signedBytes: string
}
