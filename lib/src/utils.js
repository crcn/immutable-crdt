"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shallowEquals = function (a, b) {
    var toa = typeof a;
    var tob = typeof b;
    if (toa !== tob) {
        return false;
    }
    if (toa !== "object" || !a || !b) {
        return a === b;
    }
    if (Object.keys(a).length !== Object.keys(b).length) {
        return false;
    }
    for (var key in a) {
        if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
};
exports.arraySplice = function (target, index, count) {
    if (count === void 0) { count = 1; }
    var replacements = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        replacements[_i - 3] = arguments[_i];
    }
    return __spreadArrays(target.slice(0, index), replacements, target.slice(index + count));
};
//# sourceMappingURL=utils.js.map