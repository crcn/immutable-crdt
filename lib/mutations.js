"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
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
exports.sortMutations = (mutations) => {
    return [...mutations].sort((a, b) => {
        const aParts = utils_1.getIDParts(a.id);
        const bParts = utils_1.getIDParts(b.id);
        if (aParts.timestamp !== bParts.timestamp) {
            return aParts.timestamp > bParts.timestamp ? 1 : -1;
        }
        if (aParts.counter !== bParts.counter) {
            return aParts.counter > bParts.counter ? 1 : -1;
        }
        return aParts.machineID + aParts.processID > bParts.machineID + bParts.processID ? 1 : -1;
    });
};
//# sourceMappingURL=mutations.js.map