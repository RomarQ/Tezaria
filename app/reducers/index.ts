import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import loader from './loader';
import userData from './userData';
import bakingController from './bakingController';
import { History } from 'history';

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    loader,
    userData,
    bakingController
  });
}
