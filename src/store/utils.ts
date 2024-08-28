import { configureStore, type Middleware } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import rootReducer from '@s/rootReducer';
import rootSaga from '@s/rootSaga';

const sagaMiddleware = createSagaMiddleware();

const isProduction = process.env.NODE_ENV === 'production';

const middleware: Middleware[] = [sagaMiddleware];

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
export { store };