import rpc from './rpc';

import {
    UtilsInterface,
} from './utils.d';

const self:UtilsInterface = {
    debug: false,
    watermark: {
        blockHeader:        new Uint8Array([1]), //0x01
        endorsement:        new Uint8Array([2]), //0x02
        genericOperation:   new Uint8Array([3]), //0x03
    },
    uTEZ:   { char: 'μꜩ',  unit: 1 },
    mTEZ:   { char: 'mꜩ',  unit: 1000 },
    TEZ:    { char: 'ꜩ',   unit: 1000000 },
    KTEZ:   { char: 'Kꜩ',  unit: 1000000000 },
    MTEZ:   { char: 'Mꜩ',  unit: 1000000000000 },
    setDebugMode: (mode:boolean) => self.debug = mode,
    operationType(op:any) {
        if(!op || !op.contents) return 3;

        switch (op.contents[0].kind) {
            case 'endorsement':
                return 0;
            case 'ballot':
                return 1;
            case 'activate_account':
                return 2;
            default:
                return 3;
        }
    },
    createProtocolData: (priority:number, powHeader = '', pow = '', seed = '') => {
        return `${priority.toString(16).padStart(4,"0")}${powHeader.padEnd(8, "0")}${pow.padEnd(8, "0")}${seed ? "ff"+seed.padEnd(64, "0") : "00"}`;
    },
    convertUnit: (value:number, to:{char:string, unit:number}, from:{char:string, unit:number} = self.uTEZ) => (
        ((value / to.unit) * from.unit).toLocaleString('fullwide', {maximumFractionDigits:3})
    ),
    convertUnitWithSymbol: (value:number, to:{char:string, unit:number}, from:{char:string, unit:number} = self.uTEZ) => (
        `${self.convertUnit(value, to, from)} ${to.char}`
    ),
    getSharePercentage: (balance:number, staking_balance:number) => (
        `${((balance * 100) / staking_balance).toLocaleString('fullwide', {maximumFractionDigits:2})}%`
    ),
    getShareReward: (balance:number, staking_balance:number, rewards:number) => (
        ((balance * rewards) / staking_balance)
    ),
    parseTEZWithSymbol: (value:number) => {
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
        Math.floor(level/rpc.cycleLength) * rpc.cycleLength
    ),
    lastCycleLevel: (level:number) => (
        (Math.floor(level/rpc.cycleLength) * rpc.cycleLength) + rpc.cycleLength
    )
};

export default self;