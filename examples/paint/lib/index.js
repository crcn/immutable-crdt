"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = __importStar(require("react"));
var ReactDOM = __importStar(require("react-dom"));
var redux_1 = require("redux");
var redux_saga_1 = __importDefault(require("redux-saga"));
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