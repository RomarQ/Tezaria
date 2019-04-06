import { Dispatch } from 'redux';

export enum LoadTypes {
  USER_DATA = 'USER_DATA',
  PADARIA_NODE = 'PADARIA_NODE',
  REWARDS_DATA = 'REWARDS_DATA'
}

export enum LoaderActionTypes {
  START = 'START',
  STOP = 'STOP'
}

export interface LoaderAction {
  type: LoaderActionTypes;
  loadType: LoadTypes;
}

export type LoaderPrototype = (loadType: LoadTypes, done?:boolean) => void;

const action = (actionType: LoaderActionTypes, loadType: LoadTypes):LoaderAction => 
  ({ 
    type: actionType,
    loadType
  });

const loader = (loadType: LoadTypes, done: boolean = false) => 
  (dispatch: Dispatch<LoaderAction>) => 
  dispatch(
    action(done ? LoaderActionTypes.STOP : LoaderActionTypes.START, loadType)
  );

export default { loader };