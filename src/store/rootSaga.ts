import { all } from 'redux-saga/effects';
import { userSaga } from '@s/userSagas';

export default function* rootSaga(): Generator {
  yield all([
    userSaga(),
  ]);
}