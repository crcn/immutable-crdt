"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Observable {
    constructor() {
        this._handlers = [];
        this.dispatch = (message) => {
            for (const handler of this._handlers) {
                handler(message);
            }
        };
    }
    observe(handler) {
        if (handler == null) {
            throw new Error(`handler cannot be null`);
        }
        if (this._handlers.indexOf(handler) !== -1) {
            throw new Error(`Cannot add a handler twice to an observer.`);
        }
        this._handlers.push(handler);
    }
    unobserve(handler) {
        const index = this._handlers.indexOf(handler);
        if (index === -1) {
            return;
        }
        this._handlers.splice(index, 1);
    }
}
exports.Observable = Observable;
//# sourceMappingURL=observable.js.map