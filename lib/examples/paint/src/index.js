"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var ReactDOM = require("react-dom");
var redux_1 = require("redux");
var redux_saga_1 = require("redux-saga");
var reducers_1 = require("./reducers");
var sagas_1 = require("./sagas");
var main_1 = require("./components/main");
// create the saga middleware
var sagaMiddleware = redux_saga_1.default();
redux_1.createStore(reducers_1.mainReducer, redux_1.applyMiddleware(sagaMiddleware));
// then run the saga
sagaMiddleware.run(sagas_1.mainSaga);
var mount = document.createElement("div");
document.body.appendChild(mount);
ReactDOM.render(React.createElement(main_1.MainComponent, null), mount);
//# sourceMappingURL=index.js.map