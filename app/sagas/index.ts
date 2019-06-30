import { all } from 'redux-saga/effects'
import userDataSagas from './userData'

export default function * sagas () {
  yield all([
    ...userDataSagas
  ])
}
