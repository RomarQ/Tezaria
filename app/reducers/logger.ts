import { LoggerAction, LogTypes, LoggerActionTypes, LoggerActionProps } from '../actions/logger';

export type LogProps = {
    timestamp:      number;
} & LoggerActionProps;

export type LoggerProps = {
    logger: LogProps[];
};

const defaultState = [] as LogProps[];

let counter = 0;

export default (state = defaultState, {type, ...props}:LoggerAction) => {
    switch (type) {
        case LoggerActionTypes.ADD:
            /*
            *   Send a notification to the bakers mobile
            */
            if (props.logType === LogTypes.ERROR) {
                // @TODO
            }

            return [
                    ...state,
                    {
                        key: ++counter,
                        timestamp: Date.now(),
                        ...props
                    }
                ];
        case LoggerActionTypes.REMOVE:
            return state.filter(t => t.key !== props.key);
        case LoggerActionTypes.CLEAR_ALL:
            return defaultState;
        default:
            return state;
    }
}