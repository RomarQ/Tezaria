import { UserDataActionTypes, UserDataActions } from '../actions/userData';
import { UserDataType } from '../types';
import { rpc, rewarder } from '../utils/padaria';

const defaultState = {
    ready: false,
    settings: {
        nodeAddress: rpc.nodeAddress,
        tzScanAdress: rpc.tzScanAddress,
        apiAddress: rpc.apiAddress,
        delegatorFee: rewarder.feePercentage
    }
}

export default (state: UserDataType = defaultState, action: UserDataActions) => {
    switch (action.type) {
        case UserDataActionTypes.LOAD:
            if(!action.userData.settings.nodeAddress)
            {
                action.userData.settings = defaultState.settings
            }
            return {
                ready: (!!action.userData.keys && Object.keys(action.userData.keys).length > 0),
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
            rpc.nodeAddress = action.settings.nodeAddress;
            rpc.tzScanAddress = action.settings.tzScanAddress;
            rpc.apiAddress = action.settings.apiAddress;
            rewarder.feePercentage = action.settings.delegatorFee;

            return {
                ...state,
                ready: true,
                settings: action.settings
            };
        default:
            return state;
    }
}
