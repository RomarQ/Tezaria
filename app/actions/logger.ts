import { Dispatch, ActionCreatorsMapObject } from 'redux';
import { LogOrigins } from '../utils/padaria/logger';

export enum LogTypes {
    SUCCESS = 'success',
    ERROR   = 'error',
    WARNING = 'warning',
    INFO    = 'info'
};

export enum LoggerActionTypes {
    ADD         = 'ADD_LOG',
    REMOVE      = 'REMOVE_LOG',
    CLEAR_ALL   = 'CLEAR_LOGS'
}

export interface LoggerAction {
    type: LoggerActionTypes;
    log?: LoggerActionProps
};

export type LoggerAddPrototype = (logProps:LoggerActionProps) => void;
export type LoggerRemovePrototype = (logProps:LoggerActionProps) => void;
export type LoggerClearAllPrototype = () => void;

export interface LoggerActionsPrototypes extends ActionCreatorsMapObject {
    add:        LoggerAddPrototype;
    remove:     LoggerRemovePrototype;
    clearAll:   LoggerClearAllPrototype;
}

const action = (actionType: LoggerActionTypes, logProps?:LoggerActionProps):LoggerAction => (
    logProps ? { type: actionType, log: logProps } : { type: actionType }
);

const add:LoggerAddPrototype = (logProps) => 
    (dispatch: Dispatch<LoggerAction>) => 
        dispatch( action(LoggerActionTypes.ADD, logProps) );

const remove:LoggerRemovePrototype = (logProps) => 
    (dispatch: Dispatch<LoggerAction>) => 
        dispatch( action(LoggerActionTypes.REMOVE, logProps) );

const clearAll:LoggerClearAllPrototype = () =>
    (dispatch: Dispatch<LoggerAction>) =>
        dispatch( action(LoggerActionTypes.CLEAR_ALL ) );

export default { 
    add,
    remove,
    clearAll
};