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
var INT_16 = 65536;
var _idCounter = 0;
var MACHINE_ID = Math.floor(Math.random() * (INT_16)).toString(16);
var PID = Math.floor(Math.random() * (INT_16)).toString(16);
exports.createIDGenerator = function (machineId, pid, now, inc) {
    return function () {
        var ts = Math.floor(now() / 1000).toString(16);
        var count = inc().toString(16);
        return "00000000".substr(0, 8 - ts.length) + ts +
            "000000".substr(0, 6 - machineId.length) + machineId +
            "0000".substr(0, 4 - pid.length) + pid +
            "000000".substr(0, 6 - count.length) + count;
    };
};
exports.generateId = exports.createIDGenerator(MACHINE_ID, PID, function () { return Date.now(); }, function () { return _idCounter++; });
exports.getIDParts = function (id) {
    var ctr = 0;
    var timestamp = parseInt(id.slice(ctr, ctr += 8), 16);
    var machineID = parseInt(id.slice(ctr, ctr += 6), 16);
    var processID = parseInt(id.slice(ctr, ctr += 4), 16);
    var counter = parseInt(id.slice(ctr, ctr += 6), 16);
    return { timestamp: timestamp, machineID: machineID, processID: processID, counter: counter };
};
//# sourceMappingURL=utils.js.map