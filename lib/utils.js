"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shallowEquals = (a, b) => {
    const toa = typeof a;
    const tob = typeof b;
    if (toa !== tob) {
        return false;
    }
    if (toa !== "object" || !a || !b) {
        return a === b;
    }
    if (Object.keys(a).length !== Object.keys(b).length) {
        return false;
    }
    for (const key in a) {
        if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
};
exports.arraySplice = (target, index, count = 1, ...replacements) => [
    ...target.slice(0, index),
    ...replacements,
    ...target.slice(index + count)
];
const INT_16 = 65536;
let _idCounter = 0;
const MACHINE_ID = Math.floor(Math.random() * (INT_16)).toString(16);
const PID = Math.floor(Math.random() * (INT_16)).toString(16);
exports.createIDGenerator = (machineId, pid, now, inc) => {
    return () => {
        const ts = Math.floor(now() / 1000).toString(16);
        const count = inc().toString(16);
        return "00000000".substr(0, 8 - ts.length) + ts +
            "000000".substr(0, 6 - machineId.length) + machineId +
            "0000".substr(0, 4 - pid.length) + pid +
            "000000".substr(0, 6 - count.length) + count;
    };
};
exports.generateId = exports.createIDGenerator(MACHINE_ID, PID, () => Date.now(), () => _idCounter++);
exports.getIDParts = (id) => {
    var ctr = 0;
    var timestamp = parseInt(id.slice(ctr, ctr += 8), 16);
    var machineID = parseInt(id.slice(ctr, ctr += 6), 16);
    var processID = parseInt(id.slice(ctr, ctr += 4), 16);
    var counter = parseInt(id.slice(ctr, ctr += 6), 16);
    return { timestamp, machineID, processID, counter };
};
//# sourceMappingURL=utils.js.map