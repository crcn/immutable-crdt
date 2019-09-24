"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var MutationType;
(function (MutationType) {
    MutationType["INSERT"] = "INSERT";
    MutationType["DELETE"] = "DELETE";
    MutationType["REPLACE_LIST_ITEM"] = "REPLACE_LIST_ITEM";
    MutationType["MOVE_LIST_ITEM"] = "MOVE_LIST_ITEM";
    MutationType["MAP_SET"] = "MAP_SET";
    MutationType["MAP_UNSET"] = "MAP_UNSET";
})(MutationType = exports.MutationType || (exports.MutationType = {}));
;
exports.sortMutations = function (mutations) {
    return __spreadArrays(mutations).sort(function (a, b) {
        var aParts = utils_1.getIDParts(a.id);
        var bParts = utils_1.getIDParts(b.id);
        return aParts.timestamp > bParts.timestamp || aParts.machineID > bParts.machineID || aParts.counter > bParts.counter ? 1 : -1;
    });
};
//# sourceMappingURL=mutations.js.map