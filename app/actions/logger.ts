import { Dispatch, ActionCreatorsMapObject } from 'redux'

export enum LogTypes {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export enum LoggerActionTypes {
  ADD = 'ADD_LOG',
  REMOVE = 'REMOVE_LOG',
  CLEAR_ALL = 'CLEAR_LOGS'
}

interface BaseAction {
  type: LoggerActionTypes
}

interface AddAction extends BaseAction {
  log: LoggerActionProps
}

interface RemoveAction extends BaseAction {
  key: number
}

export type LoggerActions = AddAction & RemoveAction

export type LoggerAddPrototype = (logProps: LoggerActionProps) => void
export type LoggerRemovePrototype = (key: number) => void
export type LoggerClearAllPrototype = () => void

export interface LoggerActionsPrototypes extends ActionCreatorsMapObject {
  add: LoggerAddPrototype
  remove: LoggerRemovePrototype
  clearAll: LoggerClearAllPrototype
}

const add: LoggerAddPrototype = logProps => (dispatch: Dispatch<AddAction>) =>
  dispatch({
    type: LoggerActionTypes.ADD,
    log: logProps
  })

const remove: LoggerRemovePrototype = key => (
  dispatch: Dispatch<RemoveAction>
) =>
  dispatch({
    type: LoggerActionTypes.REMOVE,
    key
  })

const clearAll: LoggerClearAllPrototype = () => (
  dispatch: Dispatch<BaseAction>
) => dispatch({ type: LoggerActionTypes.CLEAR_ALL })

export default {
  add,
  remove,
  clearAll
}
