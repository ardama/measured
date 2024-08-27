// @ts-check

import { all } from 'redux-saga/effects';
import { userSaga } from '@store/userSagas';

/**
 * @returns {Generator}
 */
export default function* rootSaga() {
  yield all([
    userSaga(),
  ]);
}