"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ErrorType;
(function (ErrorType) {
    ErrorType["TARGET_NOT_FOUND"] = "TARGET_NOT_FOUND";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
class BaseError extends Error {
    constructor(type, message) {
        super(message);
        this.type = type;
    }
}
exports.BaseError = BaseError;
class TargetNotFoundError extends BaseError {
    constructor(message) {
        super(ErrorType.TARGET_NOT_FOUND, message);
    }
}
exports.TargetNotFoundError = TargetNotFoundError;
//# sourceMappingURL=errors.js.map