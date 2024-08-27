// @ts-check

import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import rootReducer from '@store/rootReducer';
import rootSaga from '@store/rootSaga';

const sagaMiddleware = createSagaMiddleware();

const isProduction = process.env.NODE_ENV === 'production';

/**
 * @type {import('redux').Middleware[]}
 */
const middleware = [sagaMiddleware];

if (!isProduction) {
  const logger = createLogger({
    collapsed: true,
    // Add custom logging configuration here if needed
  });
  middleware.push(logger);
}

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(middleware),
});

sagaMiddleware.run(rootSaga);

/**
 * @typedef {ReturnType<typeof store.getState>} RootState
 */

/**
 * @typedef {typeof store.dispatch} AppDispatch
 */

export { store };