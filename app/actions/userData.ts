import { Dispatch } from 'redux';
import storage from '../utils/storage';
import rpc from '../utils/padaria/rpc';
import crypto from '../utils/padaria/crypto';
import bakingController from '../utils/padaria/bakingController';

export enum UserDataActionTypes {
	LOAD = 'LOAD',
	UPDATED = 'UPDATED',
	CLEAR = 'CLEAR',
	SET_KEYS = 'SET_KEYS',
	SET_SETTINGS = 'SET_SETTINGS'
}

interface LoadAction {
	type: UserDataActionTypes.LOAD;
	userData: UserDataProps;
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

export type UserDataActions =
	| LoadAction
	| UpdatedAction
	| ClearAction
	| SetKeysAction
	| SetSettingsAction;

export type LoadUserDataPrototype = () => Promise<UserDataProps>;
export type ClearUserDataPrototype = () => Promise<void>;
export type SetBakerKeysPrototype = (keys: KeysType) => Promise<void>;
export type SetBakerSettingsPrototype = (
	settings: UserSettingsType
) => Promise<void>;

export interface UserDataActionsProps {
	loadUserData: LoadUserDataPrototype;
	clearUserData: ClearUserDataPrototype;
	setBakerKeys: SetBakerKeysPrototype;
	setBakerSettings: SetBakerSettingsPrototype;
}

const loadUserData = () => (dispatch: Dispatch) => (
	new Promise((resolve, reject) => {
		crypto.signer = null;
		storage.getUserData()
			.then(userData => {
				if (!userData.error) {
					dispatch({ type: UserDataActionTypes.LOAD, userData });
					resolve(userData);
				}

				return reject(userData.error);
			})
			.catch(e => reject(e));
    })
);

const clearUserData = () => async (dispatch: Dispatch) => {
	crypto.signer = null;
	await storage.clearUserData();
	dispatch({ type: UserDataActionTypes.CLEAR });
};

const setBakerKeys = (keys: KeysType) => async (dispatch: Dispatch) => {
    crypto.loadSigner(keys);

    keys.encrypted && (delete keys.sk);

	dispatch({ 
        type: UserDataActionTypes.SET_KEYS,
        keys
    });
};

const setBakerSettings = (settings: UserSettingsType) => (dispatch: Dispatch) => (
	storage.setBakerSettings(settings).then(() => {
		dispatch({ type: UserDataActionTypes.SET_SETTINGS, settings });

		return rpc.load({
			nodeAddress: settings.nodeAddress,
			tzScanAddress: settings.tzScanAddress,
			apiAddress: settings.apiAddress
		});
    })
);

export default {
	loadUserData,
	clearUserData,
	setBakerKeys,
	setBakerSettings
};
