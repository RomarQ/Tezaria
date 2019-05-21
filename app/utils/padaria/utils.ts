import bs58check from 'bs58check';

import rpc, { QueryTypes } from './rpc';

import {
    UtilsInterface,
} from './utils.d';

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
    edsig: new Uint8Array([9, 245, 205, 134, 18]),      // 99 bytes

    chainId: new Uint8Array([87, 82, 0]),              // 15 bytes Net[...]
    nce: new Uint8Array([69, 220, 169]),
    blockHash: new Uint8Array([1,52]), // (* B(51) *)
    kt: new Uint8Array([2, 90, 121]),
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

const self:UtilsInterface = {
    debug: false,
    watermark: {
        blockHeader:        new Uint8Array([1]), //0x01
        endorsement:        new Uint8Array([2]), //0x02
        genericOperation:   new Uint8Array([3]), //0x03
    },
    PowHeader: "ba69ab95",
    uTEZ:   { char: 'μꜩ',  unit: 1 },
    mTEZ:   { char: 'mꜩ',  unit: 1000 },
    TEZ:    { char: 'ꜩ',   unit: 1000000 },
    KTEZ:   { char: 'Kꜩ',  unit: 1000000000 },
    MTEZ:   { char: 'Mꜩ',  unit: 1000000000000 },
    setDebugMode: (mode:boolean) => self.debug = mode,
    createProtocolData: (priority:number, powHeader = '', pow = '', seed = '') => (
        `${priority.toString(16).padStart(4,"0")}${powHeader.padEnd(8, "0")}${pow.padEnd(8, "0")}${seed ? "ff"+seed.padEnd(64, "0") : "00"}`
    ),
    verifyNodeCommits: async () => {
        const nodeLastCommit = await rpc.queryNode('/monitor/commit_hash', QueryTypes.GET);
        const options = {
            hostname: 'gitlab.com',
            port: 443,
            path: `/api/v4/projects/tezos%2Ftezos/repository/commits/?ref_name=${rpc.network.toLocaleLowerCase()}&per_page=100`,
            method: 'GET'
        };
        const commits = await rpc.queryRequest(options) as {
            id:string;
            author_name:string;
            committed_date:string;
            parent_ids: string[];
            message:string
        }[];

        if (!Array.isArray(commits)) return;

        let index = 0;
        for (const commit of commits) {
            if (commit.id === nodeLastCommit || commit.parent_ids.some(id => id === nodeLastCommit)) {
                return {
                    updated: index === 0,
                    currentCommitHash: nodeLastCommit,
                    lastCommitHash: commit.id,
                    commitsbehind: index,
                    author: commit.author_name,
                    date: commit.committed_date,
                    message: commit.message
                }
            }
            index++;
        }
    },
    convertUnit: (value, to, from = self.uTEZ) => (
        ((value / to.unit) * from.unit).toLocaleString('fullwide', {maximumFractionDigits:3})
    ),
    convertUnitWithSymbol: (value, to, from = self.uTEZ) => (
        `${self.convertUnit(value, to, from)} ${to.char}`
    ),
    getRewardSharePercentage: (balance, staking_balance) => (
        Number(((balance * 100) / staking_balance).toLocaleString('fullwide', {maximumFractionDigits:2}))
    ),
    getRewardShare: (balance, staking_balance, rewards) => (
        Math.floor((balance * rewards) / staking_balance)
    ),
    getRewardFee: (reward, rewardFee) => (
        Math.floor(reward * (rewardFee/100))
    ),
    getTotalRolls: (stakingBalance) => (
        Math.floor(Number(stakingBalance)/Number(rpc.networkConstants['tokens_per_roll']))
    ),
    parseTEZWithSymbol: value => {
        if (value > self.MTEZ.unit) {
            return self.convertUnitWithSymbol(value, self.MTEZ);
        } else if (value > self.KTEZ.unit) {
            return self.convertUnitWithSymbol(value, self.KTEZ);
        } else if (value > self.TEZ.unit) {
            return self.convertUnitWithSymbol(value, self.TEZ);
        } else if (value > self.mTEZ.unit) {
            return self.convertUnitWithSymbol(value, self.mTEZ);
        }
        else return self.convertUnitWithSymbol(value, self.uTEZ);
    },
    firstCycleLevel: (level:number) => (
        Math.floor(level/rpc.networkConstants['blocks_per_cycle']) * rpc.networkConstants['blocks_per_cycle']
    ),
    lastCycleLevel: (level:number) => (
        self.firstCycleLevel(level) + rpc.networkConstants['blocks_per_cycle']
    ),
    hexToBuffer: (hex:string) => new Uint8Array(
        hex.match(/[\da-f]{2}/gi).map((h) => parseInt(h, 16))
    ),
    bufferToHex: (buffer:Uint8Array) => (
        new Uint8Array(buffer).reduce((prev: string[], cur:number) => {
            prev.push(`00${cur.toString(16)}`.slice(-2));
            return prev;
        }, []).join('')
    ),
    mergeBuffers: (b1:Uint8Array, b2:Uint8Array) => {
        const newBuffer = new Uint8Array(b1.length + b2.length);
        newBuffer.set(b1);
        newBuffer.set(b2, b1.length);
        return newBuffer;
    },
    b58encode: (payload, prefix) => {
        const buffer = new Uint8Array(prefix.length + payload.length);
        buffer.set(prefix);
        buffer.set(payload, prefix.length);
        return bs58check.encode(buffer);
    },
    b58decode: (encoded, prefix) => (
        bs58check.decode(encoded).slice(prefix.length)
    ),
    int32Buffer: number => {
        return new Uint8Array([
            (number & 0xff000000) >> 24,
            (number & 0x00ff0000) >> 16,
            (number & 0x0000ff00) >> 8,
            (number & 0x000000ff)
        ]);
    },
    
    numberToZarith: (value:number) => {
        let zarith = '';

        while(true) {
            if (value >= 128) {
                let mod = (value % 128);
                value -= mod;
                value /= 128;
                mod += 128;
                zarith += mod.toString(16);
            } else {
                if (value < 16) zarith += "0";
                zarith += value.toString(16);
                break;
            }
        }
        return zarith;
    },
};

export * from './utils.d';
export default self;