import { Dispatch } from 'redux';
import { KeysType, BakingControllerStartOptions } from '../utils/padaria/types';
import bakingController from '../utils/padaria/bakingController';

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
