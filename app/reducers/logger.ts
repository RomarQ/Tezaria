import { LoggerActions, LogTypes, LoggerActionTypes } from '../actions/logger';

export type LogProps = {
	key: number;
	timestamp: number;
} & LoggerActionProps;

export interface LoggerProps {
	logger: LogProps[];
}

const defaultState: LogProps[] = [];

let counter = 0;

export default (state = defaultState, { type, ...props }: LoggerActions) => {
	switch (type) {
		case LoggerActionTypes.ADD:
			if (!props.log) return state;

			counter += 1;

			/*
			 *   Send a notification to the bakers mobile
			 */
			if (props.log && props.log.type === LogTypes.ERROR) {
				// @TODO
			}

			return [
				...state.slice(0, 20),
				{
					key: counter,
					timestamp: Date.now(),
					...props.log
				}
			];
		case LoggerActionTypes.REMOVE:
			return state.filter(t => t.key !== props.key);
		case LoggerActionTypes.CLEAR_ALL:
			return defaultState;
		default:
			return state;
	}
};
