import * as React from "react";
import * as ReactDOM from "react-dom";

import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

import {mainReducer} from './reducers';
import {mainSaga} from './sagas';
import { MainComponent } from "./components/main";

// create the saga middleware
const sagaMiddleware = createSagaMiddleware()
createStore(
  mainReducer,
  applyMiddleware(sagaMiddleware)
);

// then run the saga
sagaMiddleware.run(mainSaga);

const mount = document.createElement("div");
document.body.appendChild(mount);

ReactDOM.render(<MainComponent />, mount);
