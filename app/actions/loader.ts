import { Dispatch } from 'redux'

export enum LoadTypes {
  USER_DATA = 'USER_DATA',
  PADARIA_NODE = 'PADARIA_NODE',
  REWARDS_DATA = 'REWARDS_DATA',
  ACTIVATE_ACCOUNT = 'ACTIVATE_ACCOUNT'
}

export enum LoaderActionTypes {
  START = 'START',
  STOP = 'STOP'
}

export interface LoaderAction {
  type: LoaderActionTypes
  loadType: LoadTypes
}

export type LoaderPrototype = (loadType: LoadTypes, done?: boolean) => void

const loader = (loadType: LoadTypes, done: boolean = false) => (
  dispatch: Dispatch<LoaderAction>
) =>
  dispatch({
    type: done ? LoaderActionTypes.STOP : LoaderActionTypes.START,
    loadType
  })

export default { loader }
