import storage from 'electron-json-storage';

import { UserDataType, UserSettingsType } from '../types';

export interface StorageDataProps {
    userData?: UserDataType;
    bakerNonces?: NonceType[];
}

export interface StorageFuncProps {
    getAll: () => Promise<Error | StorageDataProps>;
    setUserData: (obj:UserDataType) => Promise<Error | void>;
    getUserData: () => Promise<{ error?:Error, keys?:KeysType, settings?:UserSettingsType }>;
    clearUserData: () => void;
    setBakerKeys: (keys:KeysType) => Promise<{ error?:Error }>;
    setBakerSettings: (settings:UserSettingsType) => Promise<{ error?:Error }>;
    clearBakerNonces: () => Promise<Error | void>;
    getBakerNonces: () => Promise<NonceType[]>;
    setBakerNonces: (nonces:NonceType[]) => Promise<Error | void>;
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
    clearUserData: () => {
        storage.remove('keys');
        storage.remove('settings');
    },
    setBakerKeys: (keys:KeysType) => new Promise((resolve, reject) => {
        storage.set('keys', keys, (error:Error) => error ? reject({ error }) : resolve({}));
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
    })
}

export default db;