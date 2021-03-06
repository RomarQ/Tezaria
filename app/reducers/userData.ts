import { UserDataActionTypes, UserDataActions } from '../actions/userData';
import { rpc, rewarder } from '../utils/padaria';

const defaultState = {
	ready: false,
	settings: {
		nodePort: rpc.nodePort,
		nodeAddress: rpc.nodeAddress,
		apiAddress: rpc.apiAddress,
		delegatorFee: rewarder.feePercentage,
		rewardsBatchSize: rewarder.paymentsBatchSize
	}
};

export default (
	state: UserDataProps = defaultState,
	action: UserDataActions
) => {
	switch (action.type) {
		case UserDataActionTypes.LOAD:
			// Repair undefined settings
			Object.keys(defaultState.settings).forEach(key => {
				if (!action.userData.settings[key])
					action.userData.settings[key] = defaultState.settings[key];
			});

			return {
				ready:
					!!action.userData.keys &&
					Object.keys(action.userData.keys).length > 0,
				...action.userData
			};

		case UserDataActionTypes.UPDATED:
			return state;
		case UserDataActionTypes.CLEAR:
			return {
				...state,
				ready: false,
				keys: null
			};
		case UserDataActionTypes.SET_KEYS:
			return {
				...state,
				ready: true,
				keys: action.keys,
				encrypted: false
			};
		case UserDataActionTypes.SET_SETTINGS:
			action.settings.nodePort &&
				(rpc.nodePort = action.settings.nodePort);
			action.settings.nodeAddress &&
				(rpc.nodeAddress = action.settings.nodeAddress);
			action.settings.apiAddress &&
				(rpc.apiAddress = action.settings.apiAddress);
			action.settings.delegatorFee &&
				(rewarder.feePercentage = action.settings.delegatorFee);
			action.settings.rewardsBatchSize &&
				(rewarder.paymentsBatchSize = action.settings.rewardsBatchSize);

			return {
				...state,
				ready: true,
				settings: action.settings
			};
		default:
			return state;
	}
};
