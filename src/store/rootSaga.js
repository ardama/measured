import { all } from 'redux-saga/effects';
import { userSaga } from '@s/userSagas';

/**
 * @returns {Generator}
 */
export default function* rootSaga() {
  yield all([
    userSaga(),
  ]);
}