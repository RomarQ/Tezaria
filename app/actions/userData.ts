import { Dispatch, ActionCreatorsMapObject } from 'redux';
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
	settings: TezariaSettingsProps;
}

export type UserDataActions =
	| LoadAction
	| UpdatedAction
	| ClearAction
	| SetKeysAction
	| SetSettingsAction;

export type LoadUserDataPrototype = () => Promise<UserDataProps>;
export type ClearUserDataPrototype = () => Promise<void>;
export type SetBakerKeysPrototype = (keys: KeysType) => (dispatch: Dispatch) => void;
export type SetBakerSettingsPrototype = (
	settings: TezariaSettingsProps
) => Promise<void>;

export interface UserDataActionsPrototypes extends ActionCreatorsMapObject {
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
    delete crypto.signer;
    bakingController.stop();
	await storage.clearUserData();
	dispatch({ type: UserDataActionTypes.CLEAR });
};

const setBakerKeys = (keys: KeysType) => (dispatch: Dispatch) => {
    crypto.loadSigner(keys.sk);

	dispatch({ 
        type: UserDataActionTypes.SET_KEYS,
        keys
    });
};

const setBakerSettings = (settings: TezariaSettingsProps) => (dispatch: Dispatch) => (
	storage.setBakerSettings(settings).then(() => {
		dispatch({ type: UserDataActionTypes.SET_SETTINGS, settings });

		return rpc.load({
            nodePort: settings.nodePort,
            nodeAddress: settings.nodeAddress,
            tzScanAddress: settings.tzScanAddress,
            apiAddress: settings.apiAddress,
            delegatorFee: settings.delegatorFee,
            rewardsBatchSize: settings.rewardsBatchSize
		});
    })
);

export default {
	loadUserData,
	clearUserData,
	setBakerKeys,
	setBakerSettings
};
