"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ErrorType;
(function (ErrorType) {
    ErrorType["TARGET_NOT_FOUND"] = "TARGET_NOT_FOUND";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
var BaseError = /** @class */ (function (_super) {
    __extends(BaseError, _super);
    function BaseError(type, message) {
        var _this = _super.call(this, message) || this;
        _this.type = type;
        return _this;
    }
    return BaseError;
}(Error));
exports.BaseError = BaseError;
var TargetNotFoundError = /** @class */ (function (_super) {
    __extends(TargetNotFoundError, _super);
    function TargetNotFoundError(message) {
        return _super.call(this, ErrorType.TARGET_NOT_FOUND, message) || this;
    }
    return TargetNotFoundError;
}(BaseError));
exports.TargetNotFoundError = TargetNotFoundError;
//# sourceMappingURL=errors.js.map