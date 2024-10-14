import { put, all, takeEvery } from 'redux-saga/effects';
import { dataSaga } from '@s/dataSaga';
import { authSaga } from '@s/authSaga';
import { type DispatchMultipleAction, DISPATCH_MULTIPLE } from '@u/hooks/useDispatchMultiple';

function* dispatchMultipleSaga(action: DispatchMultipleAction) {
  for (const singleAction of action.payload) {
    yield put(singleAction);
  }
}

export default function* rootSaga(): Generator {
  yield all([
    authSaga(),
    dataSaga(),
    yield takeEvery(DISPATCH_MULTIPLE, dispatchMultipleSaga),
  ]);
}
