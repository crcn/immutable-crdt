"use strict";
/**
 */
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var records_1 = require("./records");
var OTMutationType;
(function (OTMutationType) {
    OTMutationType[OTMutationType["INSERT"] = 0] = "INSERT";
    OTMutationType[OTMutationType["DELETE"] = 1] = "DELETE";
    OTMutationType[OTMutationType["UPDATE"] = 2] = "UPDATE";
    OTMutationType[OTMutationType["MOVE"] = 3] = "MOVE";
})(OTMutationType || (OTMutationType = {}));
;
exports.diff = function (oldItem, newItem, path, operations) {
    if (path === void 0) { path = []; }
    if (operations === void 0) { operations = []; }
    if (oldItem === newItem) {
        return operations;
    }
    if (typeof oldItem !== typeof newItem || (!oldItem || typeof oldItem !== "object")) {
        if (oldItem !== newItem) {
            operations.push(upd(newItem, path));
        }
    }
    if (Array.isArray(oldItem)) {
        diffArray(oldItem, newItem, path, operations);
    }
    else if (typeof oldItem === "object") {
        diffObject(oldItem, newItem, path, operations);
    }
    return operations;
};
var del = function (path) { return ({ type: OTMutationType.DELETE, path: path }); };
var ins = function (value, path) { return ({ type: OTMutationType.INSERT, value: value, path: path }); };
var mov = function (path, newPath) { return ({ type: OTMutationType.MOVE, newPath: newPath, path: path }); };
var upd = function (value, path) { return ({ type: OTMutationType.UPDATE, value: value, path: path }); };
var diffArray = function (oldArray, newArray, path, operations) {
    var model = oldArray.concat();
    var used = {};
    // insert, update, move
    for (var i = 0, n = newArray.length; i < n; i++) {
        var newItem = newArray[i];
        var oldItem = void 0;
        for (var j = 0, n2 = oldArray.length; j < n2; j++) {
            if (used[j]) {
                continue;
            }
            var item = oldArray[j];
            if (newItem === item) {
                oldItem = item;
                used[j] = 1;
                break;
            }
        }
        var newChildPath = __spreadArrays(path, [i]);
        if (i >= model.length) {
            operations.push(ins(newItem, newChildPath));
            // does not exist
        }
        else if (oldItem == null) {
            var replItem = oldArray[i];
            var existing = void 0;
            for (var k = i, n_1 = newArray.length; k < n_1; k++) {
                var item = newArray[k];
                if (replItem === item) {
                    existing = replItem;
                    break;
                }
            }
            // if the item exists, then just insert the new item -- we'll get to it eventually
            if (existing) {
                model.splice(i, 0, newItem);
            }
            else {
                // otherwise, remove the item since it doesn't exist
                model.splice(i, 1, newItem);
                operations.push(del(newChildPath));
            }
            operations.push(ins(newItem, newChildPath));
            // exists
        }
        else {
            var oldIndex = model.indexOf(oldItem, i);
            if (oldIndex !== i) {
                model.splice(oldIndex, 1);
                model.splice(i, 0, oldItem);
                operations.push(mov(__spreadArrays(path, [oldIndex]), newChildPath));
            }
            exports.diff(oldItem, newItem, newChildPath, operations);
        }
    }
    // delete
    var lastNewArrayIndex = newArray.length;
    for (var j = lastNewArrayIndex, length_1 = model.length; j < length_1; j++) {
        operations.push(del(__spreadArrays(path, [lastNewArrayIndex])));
    }
    return operations;
};
var diffObject = function (oldItem, newItem, path, operations) {
    for (var key in oldItem) {
        if (newItem[key] == null && oldItem[key] != null) {
            operations.push(del(__spreadArrays(path, [key])));
        }
        else {
            exports.diff(oldItem[key], newItem[key], __spreadArrays(path, [key]), operations);
        }
    }
    for (var key in newItem) {
        if (oldItem[key] == null) {
            operations.push(ins(newItem[key], __spreadArrays(path, [key])));
        }
    }
    return operations;
};
exports.patchRecord = function (item, mutations, createRecord) {
    for (var _i = 0, mutations_1 = mutations; _i < mutations_1.length; _i++) {
        var mutation = mutations_1[_i];
        var parent_1 = item;
        for (var i = 0, n = mutation.path.length - 1; i < n; i++) {
            var pathPart = mutation.path[i];
            if (parent_1 instanceof records_1.Map) {
                parent_1 = parent_1.properties[pathPart];
            }
            else if (parent_1 instanceof records_1.List) {
                parent_1 = parent_1.items[pathPart];
            }
        }
        var property = mutation.path[mutation.path.length - 1];
        if (parent_1 instanceof records_1.List && typeof property === "number") {
            switch (mutation.type) {
                case OTMutationType.DELETE: {
                    parent_1.removeAt(property);
                    break;
                }
                case OTMutationType.UPDATE: {
                    parent_1.removeAt(property);
                    parent_1.insert(property, createRecord(mutation.value));
                    break;
                }
                case OTMutationType.INSERT: {
                    parent_1.insert(property, createRecord(mutation.value));
                    break;
                }
                case OTMutationType.MOVE: {
                    var item_1 = parent_1.items[property];
                    parent_1.remove(item_1);
                    parent_1.insert(Number(mutation.newPath[mutation.newPath.length - 1]), item_1);
                    break;
                }
            }
        }
        else if (parent_1 instanceof records_1.Map && typeof property === "string") {
            switch (mutation.type) {
                case OTMutationType.DELETE: {
                    parent_1.removeValue(property);
                    break;
                }
                case OTMutationType.INSERT:
                case OTMutationType.UPDATE: {
                    parent_1.setValue(property, createRecord(mutation.value));
                    break;
                }
                case OTMutationType.MOVE: {
                    var item_2 = parent_1.getValue(property);
                    parent_1.removeValue(property);
                    parent_1.setValue(String(mutation.newPath[mutation.newPath.length - 1]), item_2);
                    break;
                }
            }
        }
    }
};
//# sourceMappingURL=ot.js.map