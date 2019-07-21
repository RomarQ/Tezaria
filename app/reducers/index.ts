import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
import loader from './loader';
import userData from './userData';
import bakingController from './bakingController';
import logger from './logger';

export default function createRootReducer(history: History) {
	return combineReducers({
		router: connectRouter(history),
		loader,
		userData,
		bakingController,
		logger
	});
}
