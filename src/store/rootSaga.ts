import { put, all, takeEvery } from 'redux-saga/effects';
import { userSaga } from '@s/userSagas';

import { type DispatchMultipleAction, DISPATCH_MULTIPLE } from '@u/hooks/useDispatchMultiple';

function* dispatchMultipleSaga(action: DispatchMultipleAction) {
  for (const singleAction of action.payload) {
    yield put(singleAction);
  }
}

export default function* rootSaga(): Generator {
  yield all([
    userSaga(),
    yield takeEvery(DISPATCH_MULTIPLE, dispatchMultipleSaga),
  ]);
}
