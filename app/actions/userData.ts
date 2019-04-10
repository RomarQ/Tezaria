import { Dispatch } from 'redux';
import { UserDataType } from '../types';
import { KeysType } from '../utils/padaria/types';
import storage from '../utils/storage';
import { UserSettingsType } from '../types';

export enum UserDataActionTypes {
    LOAD          = 'LOAD',
    UPDATED       = 'UPDATED',
    CLEAR         = 'CLEAR',
    SET_KEYS      = 'SET_KEYS',
    SET_SETTINGS  = 'SET_SETTINGS'
}

interface LoadAction {
    type: UserDataActionTypes.LOAD;
    userData: UserDataType;
}

interface UpdatedAction {
    type: UserDataActionTypes.UPDATED;
}

interface ClearAction {
    type: UserDataActionTypes.CLEAR;
}

interface SetKeysAction {
    type: UserDataActionTypes.SET_KEYS;
    keys: KeysType;
}

interface SetSettingsAction {
    type: UserDataActionTypes.SET_SETTINGS;
    settings: UserSettingsType;
}

export type UserDataActions = LoadAction | UpdatedAction | ClearAction | SetKeysAction | SetSettingsAction;

export type LoadUserDataPrototype = () => void;
export type UpdateUserDataPrototype = (userData:UserDataType) => void;
export type ClearUserDataPrototype = () => void;
export type SetBakerKeysPrototype = (keys:KeysType) => void;
export type SetBakerSettingsPrototype = (settings:UserSettingsType) => void;

const loadUserData = () => (dispatch:Dispatch) => 
    new Promise((resolve, reject) => {
        storage.getUserData()
            .then(userData => {
                if (!userData.error) {
                    dispatch({ type: UserDataActionTypes.LOAD, userData });
                    resolve(userData);
                }
                else reject(userData.error);
            });
    });

const clearUserData = () =>
    (dispatch:Dispatch) => {
        storage.clearUserData();
        dispatch({ type: UserDataActionTypes.CLEAR });
    }

const setBakerKeys = (keys:KeysType) => async (dispatch:Dispatch) => {
    dispatch({ type: UserDataActionTypes.SET_KEYS, keys });
}

const setBakerSettings = (settings:UserSettingsType) =>
    (dispatch:Dispatch) => 
        storage.setBakerSettings(settings).then(() => dispatch({ type: UserDataActionTypes.SET_SETTINGS, settings }));


export default { loadUserData, clearUserData, setBakerKeys, setBakerSettings };
