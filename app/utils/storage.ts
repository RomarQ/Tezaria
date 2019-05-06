import storage from 'electron-json-storage';

import { UserDataType, UserSettingsType } from '../types';
import { UnsignedOperationProps } from './padaria/operations';

export interface StorageDataProps {
    userData?: UserDataType;
    bakerNonces?: NonceType[];
}

export interface StorageFuncProps {
    getAll: () => Promise<Error | StorageDataProps>;
    setUserData: (obj:UserDataType) => Promise<Error | void>;
    getUserData: () => Promise<{ error?:Error, keys?:KeysType, settings?:UserSettingsType }>;
    clearUserData: () => Promise<Error[]>;
    setBakerKeys: (keys:KeysType) => Promise<{ error?:Error }>;
    setBakerSettings: (settings:UserSettingsType) => Promise<{ error?:Error }>;
    clearBakerNonces: () => Promise<Error | void>;
    getBakerNonces: () => Promise<NonceType[]>;
    setBakerNonces: (nonces:NonceType[]) => Promise<Error | void>;
    setLastRewardedCycle: (cycle:number) => Promise<{ error?:Error }>;
    getLastRewardedCycle: () => Promise<{ error?:Error; cycle?:number; }>;
    setSentRewardsByCycle: (cycle:number, transactionsStatus:any[]) => Promise<{ error?:Error }>;
    getSentRewardsByCycle: (cycle:number) => Promise<{ error?:Error; operations?:UnsignedOperationProps[]; }>;
}

const db:StorageFuncProps = {
    // User Data
    getAll: () => new Promise((resolve, reject)  => {
        storage.getAll((err:Error, data:StorageDataProps) => err ? reject(err) : resolve(data));
    }),
    setUserData: (obj:UserDataType) => new Promise((resolve, reject) => {
        storage.set('userData', obj, (err:Error) => err ? reject(err) : resolve(null));
    }),
    getUserData: async () => {
        const keys = await new Promise((resolve, reject) => {
            storage.get('keys', (error:Error, data:KeysType) => error ? reject({ error }) : resolve({ data }));
        }) as { error?:Error, data?:KeysType };
        const settings = await new Promise((resolve, reject) => {
            storage.get('settings', (error:Error, data:UserSettingsType) => error ? reject({ error }) : resolve({ data }));
        }) as { error?:Error, data?:UserSettingsType };

        if(keys.error || settings.error) return { error: new Error("Not able to get User Data from the Storage! :(") };

        return { keys: keys.data , settings: settings.data };
    },
    clearUserData: () => new Promise(resolve => {
        let completed = 0;
        let results = [] as Array<Error>;

        storage.remove('keys', (error:Error) => {
            completed++;
            if (error) results.push(error);

            if (completed === 2)
                resolve(results);
        });
        storage.remove('settings', (error:Error) => {
            completed++;
            if (error) results.push(error);

            if (completed === 2)
                resolve(results);
        });
    }),
    setBakerKeys: (keys:KeysType) => new Promise((resolve, reject) => {
        storage.set('keys', keys, (error:Error) => error ? resolve({ error }) : resolve({}));
    }),
    setBakerSettings: (settings:UserSettingsType) => new Promise((resolve, reject) => {
        storage.set('settings', settings, (error:Error) => error ? reject({ error }) : resolve({}));
    }),
    // Baker Data
    clearBakerNonces: () => new Promise((resolve, reject) => {
        storage.remove('bakerNonces', (err:Error) => err ? reject(err) : resolve(null));
    }),
    getBakerNonces: () => new Promise((resolve, reject) => {
        storage.get('bakerNonces', (err:Error, data:any) => {
            if(err) console.error(err);

            Array.isArray(data) ? resolve(data) : resolve([]);
        });
    }),
    setBakerNonces: (nonces:NonceType[]) => new Promise((resolve, reject) => {
        storage.set('bakerNonces', nonces, (err:Error) => err ? reject(err) : resolve(null));
    }),
    getLastRewardedCycle: () => new Promise((resolve, reject) => {
        storage.get('lastRewardedCycle', (error:Error, cycle:number) => {
            error ? reject({ error }) : resolve({ cycle });
        });
    }),
    setLastRewardedCycle: (cycle:number) => new Promise(async(resolve, reject) => {
        const lastCycle = (await db.getLastRewardedCycle()).cycle;
        if (typeof lastCycle != 'number' || lastCycle < cycle) {
            storage.set('lastRewardedCycle', cycle, (error:Error) => error ? reject({ error }) : resolve({}));
        };
        resolve({});
    }),
    setSentRewardsByCycle: (cycle, operations) => new Promise(async (resolve, reject) => {
        if (!cycle || !operations)
            reject({ error: 'Cycle and Reward operations need to be specified.' });

        await db.setLastRewardedCycle(cycle);

        const otherOps = await db.getSentRewardsByCycle(cycle);
        if (Array.isArray(otherOps.operations)) {
            operations = [
                ...otherOps.operations,
                ...operations
            ];
        }

        storage.set(`reward-operations-${cycle}`, operations, (error:Error) => error ? reject({ error }) : resolve({}));
    }),
    getSentRewardsByCycle: cycle => new Promise((resolve, reject) => {
        if (!cycle)
            reject({ error: 'Cycle not specified.' });

        storage.get(`reward-operations-${cycle}`, (error:Error, operations:any[]) => error ? reject({ error }) : resolve({ operations }));
    }),
}

export default db;