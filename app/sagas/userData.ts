import { put, takeLatest } from 'redux-saga/effects';
import { UserDataActionTypes } from '../actions/userData';
import { LoaderActionTypes, LoadTypes } from '../actions/loader';

function* loaded() {
    yield put({ type: UserDataActionTypes.UPDATED });
    yield put({ type: LoaderActionTypes.STOP, loadType: LoadTypes.USER_DATA });
}

/*
  takeLatest()
  Does not allow concurrency. If "UserDataActionTypes.LOAD" gets
  dispatched while a fetch is already pending, that pending fetch is cancelled
  and only the latest one will be run.
*/

export default [
    takeLatest(UserDataActionTypes.LOAD, loaded),
    takeLatest(UserDataActionTypes.CLEAR, loaded)
];