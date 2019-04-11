import { Dispatch } from 'redux';
import bakingController, { BakingControllerStartOptions } from '../utils/padaria/bakingController';
import { KeysType } from '../utils/padaria/types';

export enum ControllerActionTypes {
    START = 'BAKING_CONTROLLER_START',
    STOP = 'BAKING_CONTROLLER_STOP'
}

interface StartAction {
    type: ControllerActionTypes.START;
    options ?: BakingControllerStartOptions;
}

interface StopAction {
    type: ControllerActionTypes.STOP;
}

export type ControllerActions = StartAction | StopAction;

export type StartControllerPrototype = (keys: KeysType, options:BakingControllerStartOptions) => void;
export type StopControllerPrototype = () => void;

const startController:StartControllerPrototype = (keys, options) => {
    bakingController.start(keys, options);

    return (dispatch:Dispatch) => {
      dispatch({ type: ControllerActionTypes.START, options });
    }
}

const stopController:StartControllerPrototype = () => {
    bakingController.stop();

    return (dispatch:Dispatch) => {
      dispatch({ type: ControllerActionTypes.STOP });
    }
}

export default { startController, stopController };
