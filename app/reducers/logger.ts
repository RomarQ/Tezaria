import { LoggerAction, LogTypes, LoggerActionTypes } from '../actions/logger';

export type LogProps = {
    timestamp:      number;
} & LoggerActionProps;

export type LoggerProps = {
    logger: LogProps[];
};

const defaultState:LogProps[] = [];

let counter = 0;

export default (state = defaultState, {type, ...props}:LoggerAction) => {
    switch (type) {
        case LoggerActionTypes.ADD:
            if (!props.log)
                return state;
            /*
            *   Send a notification to the bakers mobile
            */
            if (props.log && props.log.type === LogTypes.ERROR) {
                // @TODO
            }

            return [
                    ...state.slice(0, 20),
                    {
                        key: ++counter,
                        timestamp: Date.now(),
                        ...props.log
                    }
                ];
        case LoggerActionTypes.REMOVE:
            return state.filter(t => props.log && t.key !== props.log.key);
        case LoggerActionTypes.CLEAR_ALL:
            return defaultState;
        default:
            return state;
    }
}