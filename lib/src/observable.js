"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observable = /** @class */ (function () {
    function Observable() {
        var _this = this;
        this._handlers = [];
        this.dispatch = function (message) {
            for (var _i = 0, _a = _this._handlers; _i < _a.length; _i++) {
                var handler = _a[_i];
                handler(message);
            }
        };
    }
    Observable.prototype.observe = function (handler) {
        if (handler == null) {
            throw new Error("handler cannot be null");
        }
        if (this._handlers.indexOf(handler) !== -1) {
            throw new Error("Cannot add a handler twice to an observer.");
        }
        this._handlers.push(handler);
    };
    Observable.prototype.unobserve = function (handler) {
        var index = this._handlers.indexOf(handler);
        if (index === -1) {
            return;
        }
        this._handlers.splice(index, 1);
    };
    return Observable;
}());
exports.Observable = Observable;
//# sourceMappingURL=observable.js.map